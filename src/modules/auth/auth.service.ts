
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { EmailService } from '../auth/notification/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiration: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiration: string;
  private readonly saltRounds = 10;
  private readonly resetTokenExpiry = 3600000; // 1 hour in milliseconds
  private readonly verificationTokenExpiry = 86400000; // 24 hours in milliseconds

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtExpiration = this.configService.get<string>('JWT_EXPIRATION', '15m');
    this.jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    this.jwtRefreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password, displayName } = registerDto;

    await this.checkUserExists(email, username);

    const hashedPassword = await this.hashPassword(password);
    const verificationToken = this.generateSecureToken();
    const verificationTokenExpiry = new Date(Date.now() + this.verificationTokenExpiry);

    // DEBUG: Log token generation
    this.logger.debug('=== REGISTRATION DEBUG ===');
    this.logger.debug(`Email: ${email}`);
    this.logger.debug(`Plain token (first 20 chars): ${verificationToken.substring(0, 20)}...`);
    this.logger.debug(`Plain token (FULL): ${verificationToken}`);
    this.logger.debug(`Plain token length: ${verificationToken.length}`);
    this.logger.debug(`Token expiry: ${verificationTokenExpiry}`);

    const hashedToken = await this.hashPassword(verificationToken);
    this.logger.debug(`Hashed token (first 20 chars): ${hashedToken.substring(0, 20)}...`);
    this.logger.debug('==========================');

    const user = await this.userModel.create({
      email,
      username,
      displayName,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      verificationToken: hashedToken, // Store hashed version
      verificationTokenExpiry,
      stats: this.getDefaultStats(),
    });

    const [tokens] = await Promise.all([
      this.generateTokens(user),
      this.emailService.sendVerificationEmail(email, displayName, verificationToken), // Send plain version
      this.emailService.sendLoginNotification(email, displayName, 'Registration'),
    ]);

    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.findUserByEmail(email, true);
    await this.verifyPassword(password, user.password);

    const [tokens] = await Promise.all([
      this.generateTokens(user),
      this.emailService.sendLoginNotification(email, user.displayName, 'Login'),
    ]);

    await this.updateUserOnLogin(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Google OAuth Login/Signup Handler
   */
  async googleLogin(googleUser: any): Promise<AuthResponseDto> {
    const { googleId, email, displayName, avatar } = googleUser;

    const existingUser = await this.userModel.findOne({ email }).exec();

    let user: UserDocument;

    if (existingUser) {
      user = await this.userModel.findOneAndUpdate(
        { email },
        {
          $set: {
            googleId,
            'stats.lastActive': new Date(),
            ...(existingUser.avatar.includes('dicebear') && avatar ? { avatar } : {}),
          },
        },
        { new: true }
      ).exec();
    } else {
      user = await this.userModel.create({
        email,
        username: this.generateUsername(email),
        displayName,
        googleId,
        avatar,
        isEmailVerified: true,
        stats: this.getDefaultStats(),
      });
    }

    const [tokens] = await Promise.all([
      this.generateTokens(user),
      this.emailService.sendLoginNotification(
        email, 
        displayName, 
        existingUser ? 'Google Login' : 'Registration'
      ),
    ]);

    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.userModel
      .findById(userId)
      .select('refreshToken email username displayName role avatar')
      .exec();

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const [tokens] = await Promise.all([
      this.generateTokens(user),
      this.emailService.sendLoginNotification(user.email, user.displayName, 'Token Refresh'),
    ]);

    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken: null },
      { new: false }
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel
      .findOne({ email })
      .select('email displayName')
      .lean()
      .exec();

    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = this.generateSecureToken();
    const resetTokenExpiry = new Date(Date.now() + this.resetTokenExpiry);

    await this.userModel.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: await this.hashPassword(resetToken),
        resetPasswordExpiry: resetTokenExpiry,
      },
      { new: false }
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.displayName,
      resetToken,
    );

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    const users = await this.userModel
      .find({
        resetPasswordExpiry: { $gt: new Date() },
        resetPasswordToken: { $ne: null },
      })
      .select('email displayName resetPasswordToken resetPasswordExpiry password googleId')
      .exec();

    if (!users || users.length === 0) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    let matchedUser: UserDocument | null = null;
    for (const user of users) {
      if (user.resetPasswordToken && token) {
        try {
          const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
          if (isTokenValid) {
            matchedUser = user;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (matchedUser.password) {
      const isSamePassword = await bcrypt.compare(newPassword, matchedUser.password);
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from the old password');
      }
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.userModel.findByIdAndUpdate(
      matchedUser._id,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        refreshToken: null,
      },
      { new: false }
    );

    await this.emailService.sendPasswordChangedNotification(
      matchedUser.email,
      matchedUser.displayName,
    );

    return { message: 'Password has been reset successfully. Please login with your new password' };
  }

  async resendVerificationToken(email: string): Promise<{ message: string }> {
    const user = await this.userModel
      .findOne({ email })
      .select('email displayName isEmailVerified verificationTokenExpiry')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.verificationTokenExpiry.getTime() - Date.now()) / 60000
      );
      throw new BadRequestException(
        `Please wait ${minutesRemaining} minutes before requesting a new verification token`
      );
    }

    const verificationToken = this.generateSecureToken();
    const verificationTokenExpiry = new Date(Date.now() + this.verificationTokenExpiry);

    // DEBUG: Log resend token
    this.logger.debug('=== RESEND VERIFICATION DEBUG ===');
    this.logger.debug(`Email: ${email}`);
    this.logger.debug(`New token (first 20 chars): ${verificationToken.substring(0, 20)}...`);
    this.logger.debug(`New token (FULL): ${verificationToken}`);
    this.logger.debug(`New token expiry: ${verificationTokenExpiry}`);
    this.logger.debug('=================================');

    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        verificationToken: await this.hashPassword(verificationToken),
        verificationTokenExpiry,
      },
      { new: false }
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      user.displayName,
      verificationToken,
    );

    return { message: 'Verification email has been sent successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // DEBUG: Log incoming token
    this.logger.debug('=== EMAIL VERIFICATION DEBUG ===');
    this.logger.debug(`Received token (first 20 chars): ${token?.substring(0, 20)}...`);
    this.logger.debug(`Received token length: ${token?.length}`);

    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    // Trim whitespace
    const cleanToken = token.trim();
    this.logger.debug(`Clean token: ${cleanToken}`);

    // First, check if there's an already verified user (to give a better message)
    const verifiedUser = await this.userModel
      .findOne({
        isEmailVerified: true,
      })
      .select('email isEmailVerified')
      .limit(1)
      .exec();

    // Find users with non-expired tokens that need verification
    const users = await this.userModel
      .find({
        verificationTokenExpiry: { $gt: new Date() },
        verificationToken: { $ne: null },
        isEmailVerified: false,
      })
      .select('email displayName isEmailVerified verificationTokenExpiry verificationToken')
      .exec();

    this.logger.debug(`Found ${users.length} users with non-expired tokens`);

    if (!users || users.length === 0) {
      // Check if user might be already verified
      if (verifiedUser) {
        this.logger.warn('Token not found - user may already be verified');
        return { message: 'Email has already been verified. You can now login.' };
      }
      
      this.logger.warn('No users found with valid verification tokens');
      throw new BadRequestException('Invalid or expired verification token');
    }

    let matchedUser: UserDocument | null = null;
    for (const user of users) {
      if (user.verificationToken && cleanToken) {
        try {
          this.logger.debug(`\n--- Checking user: ${user.email} ---`);
          this.logger.debug(`Stored hash (first 20 chars): ${user.verificationToken.substring(0, 20)}...`);
          this.logger.debug(`Token expiry: ${user.verificationTokenExpiry}`);
          
          const isTokenValid = await bcrypt.compare(cleanToken, user.verificationToken);
          this.logger.debug(`Token match result: ${isTokenValid}`);
          
          if (isTokenValid) {
            matchedUser = user;
            this.logger.debug(`✓ Match found for user: ${user.email}`);
            break;
          }
        } catch (error) {
          this.logger.error(`Error comparing token for user ${user.email}:`, error);
          continue;
        }
      }
    }

    if (!matchedUser) {
      this.logger.warn('No matching user found for provided token');
      // Check again if user is already verified (token may have been used)
      if (verifiedUser) {
        return { message: 'Email has already been verified. You can now login.' };
      }
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userModel.findByIdAndUpdate(
      matchedUser._id,
      {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
      { new: false }
    );

    this.logger.log(`Email verified successfully for: ${matchedUser.email}`);

    // Send welcome email in background (don't await to avoid slowing response)
    this.emailService.sendWelcomeEmail(
      matchedUser.email, 
      matchedUser.displayName
    ).catch(err => {
      this.logger.error(`Failed to send welcome email: ${err.message}`);
    });

    this.logger.debug('================================');
    return { message: 'Email verified successfully' };
  }
  
  // ==================== PRIVATE HELPER METHODS ====================

  private async checkUserExists(email: string, username: string): Promise<void> {
    const existingUser = await this.userModel
      .findOne({ $or: [{ email }, { username }] })
      .select('email username')
      .lean()
      .exec();

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }
  }

  private async findUserByEmail(email: string, includePassword = false): Promise<UserDocument> {
    const query = this.userModel.findOne({ email });
    
    if (includePassword) {
      query.select('+password');
    }

    const user = await query.exec();

    if (!user || (includePassword && !user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<void> {
    const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateUsername(email: string): string {
    return email.split('@')[0] + Math.floor(Math.random() * 10000);
  }

  private getDefaultStats() {
    return {
      totalQuizzes: 0,
      totalScore: 0,
      averageScore: 0,
      rank: 0,
      streak: 0,
      lastActive: new Date(),
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await this.hashPassword(refreshToken);
    await this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken: hashedToken },
      { new: false }
    );
  }

  private async updateUserOnLogin(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await this.hashPassword(refreshToken);
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        refreshToken: hashedToken,
        'stats.lastActive': new Date(),
      },
      { new: false }
    );
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
  
  private sanitizeUser(user: UserDocument): UserResponseDto {
    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
    };
  }
}
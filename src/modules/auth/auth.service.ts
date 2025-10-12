// src/modules/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
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
  // Cache frequently accessed config values
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

    const user = await this.userModel.create({
      email,
      username,
      displayName,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      verificationToken: await this.hashPassword(verificationToken),
      verificationTokenExpiry,
      stats: this.getDefaultStats(),
    });

    const [tokens] = await Promise.all([
      this.generateTokens(user),
      this.emailService.sendVerificationEmail(email, displayName, verificationToken),
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

  async googleLogin(googleUser: any): Promise<AuthResponseDto> {
    const { googleId, email, displayName, avatar } = googleUser;

    const user = await this.userModel.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          username: this.generateUsername(email),
          displayName,
          googleId,
          avatar,
          isEmailVerified: true,
          stats: this.getDefaultStats(),
        },
        $set: {
          googleId,
          'stats.lastActive': new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const [tokens] = await Promise.all([
      this.generateTokens(user),
      this.emailService.sendLoginNotification(email, displayName, 'Google Login'),
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

    // Always return success message for security (prevent email enumeration)
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

    const user = await this.userModel
      .findOne({
        resetPasswordExpiry: { $gt: new Date() },
      })
      .select('email displayName resetPasswordToken resetPasswordExpiry password')
      .exec();

    if (!user || !user.resetPasswordToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Prevent password reuse
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from the old password');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        refreshToken: null, // Invalidate all sessions
      },
      { new: false }
    );

    await this.emailService.sendPasswordChangedNotification(
      user.email,
      user.displayName,
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

    // Rate limiting: Check if previous token is still valid (prevent spam)
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
    const user = await this.userModel
      .findOne({
        verificationTokenExpiry: { $gt: new Date() },
        isEmailVerified: false,
      })
      .select('email displayName verificationToken isEmailVerified')
      .exec();

    if (!user || !user.verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const isTokenValid = await bcrypt.compare(token, user.verificationToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
      { new: false }
    );

    await this.emailService.sendWelcomeEmail(user.email, user.displayName);

    return { message: 'Email verified successfully' };
  }

  // ==================== PRIVATE HELPER METHODS (DRY) ====================

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
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: this.jwtRefreshExpiration,
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
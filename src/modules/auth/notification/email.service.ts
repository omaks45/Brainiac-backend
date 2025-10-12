// src/modules/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: Transporter;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        this.transporter = nodemailer.createTransport({
        service: this.configService.get<string>('EMAIL_SERVICE'),
        auth: {
            user: this.configService.get<string>('EMAIL_USER'),
            pass: this.configService.get<string>('EMAIL_PASS'),
        },
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
        if (error) {
            this.logger.error('Email transporter verification failed:', error);
        } else {
            this.logger.log('Email server is ready to send messages');
        }
        });
    }

    /**
     * Send login/token generation notification to user
     * @param email - User's email address
     * @param displayName - User's display name
     * @param actionType - Type of action (Login, Registration, Token Refresh)
     */
    async sendLoginNotification(
        email: string,
        displayName: string,
        actionType: 'Login' | 'Registration' | 'Google Login' | 'Token Refresh',
    ): Promise<void> {
        try {
        const timestamp = this.getCurrentTimestamp();
        
        const actionMessages = {
            Login: 'You successfully logged in to your Brainiacs account.',
            Registration: 'Welcome! Your Brainiacs account has been created successfully.',
            'Google Login': 'You logged in using your Google account.',
            'Token Refresh': 'Your session was refreshed and new tokens were generated.',
        };

        const mailOptions = {
            from: {
            name: 'Brainiacs Quiz Platform',
            address: this.configService.get<string>('EMAIL_USER'),
            },
            to: email,
            subject: `${actionType} Notification - Brainiacs`,
            html: this.buildEmailTemplate(
            '🧠 Brainiacs',
            displayName,
            actionMessages[actionType],
            `
                <div class="info-box">
                <p><strong>Action:</strong> ${actionType}</p>
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>New tokens:</strong> Generated ✓</p>
                </div>
                ${actionType === 'Registration' ? '<p style="margin: 20px 0;">Get started by taking your first quiz and competing with others!</p><a href="https://brainiacs.com/dashboard" class="button">Go to Dashboard</a>' : ''}
                <div class="security-note">
                <strong>Security Notice:</strong> If you didn't perform this action, please secure your account immediately and contact our support team.
                </div>
            `
            ),
            text: this.getPlainTextEmail(displayName, actionType, timestamp),
        };

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`${actionType} notification sent successfully to ${email}`);
        } catch (error) {
        this.logger.error(`Failed to send ${actionType} notification to ${email}:`, error);
        }
    }

    /**
     * Send password reset email
     * @param email - User's email address
     * @param displayName - User's display name
     * @param resetToken - Password reset token
     */
    async sendPasswordResetEmail(
        email: string,
        displayName: string,
        resetToken: string,
    ): Promise<void> {
        try {
        const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: {
            name: 'Brainiacs Security',
            address: this.configService.get<string>('EMAIL_USER'),
            },
            to: email,
            subject: 'Password Reset Request - Brainiacs',
            html: this.getPasswordResetTemplate(displayName, resetUrl),
            text: `Password Reset Request\n\nHello ${displayName},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
        };

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Password reset email sent to ${email}`);
        } catch (error) {
        this.logger.error(`Failed to send password reset email to ${email}:`, error);
        throw error;
        }
    }

    /**
     * Send password changed notification
     * @param email - User's email address
     * @param displayName - User's display name
     */
    async sendPasswordChangedNotification(
        email: string,
        displayName: string,
    ): Promise<void> {
        try {
        const timestamp = this.getCurrentTimestamp();
        
        const mailOptions = {
            from: {
            name: 'Brainiacs Security',
            address: this.configService.get<string>('EMAIL_USER'),
            },
            to: email,
            subject: 'Password Changed Successfully - Brainiacs',
            html: this.getPasswordChangedTemplate(displayName, timestamp),
            text: `Password Changed\n\nHello ${displayName},\n\nYour password was successfully changed at ${timestamp}.\n\nIf you didn't make this change, please contact support immediately.`,
        };

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Password changed notification sent to ${email}`);
        } catch (error) {
        this.logger.error(`Failed to send password changed notification to ${email}:`, error);
        }
    }

    /**
     * Send email verification link
     * @param email - User's email address
     * @param displayName - User's display name
     * @param verificationToken - Email verification token
     */
    async sendVerificationEmail(
        email: string,
        displayName: string,
        verificationToken: string,
    ): Promise<void> {
        try {
        const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: {
            name: 'Brainiacs',
            address: this.configService.get<string>('EMAIL_USER'),
            },
            to: email,
            subject: 'Verify Your Email - Brainiacs',
            html: this.getVerificationEmailTemplate(displayName, verificationUrl),
            text: `Email Verification\n\nHello ${displayName},\n\nWelcome to Brainiacs! Please verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
        };

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Verification email sent to ${email}`);
        } catch (error) {
        this.logger.error(`Failed to send verification email to ${email}:`, error);
        throw error;
        }
    }

    /**
     * Send welcome email after verification
     * @param email - User's email address
     * @param displayName - User's display name
     */
    async sendWelcomeEmail(
        email: string,
        displayName: string,
    ): Promise<void> {
        try {
        const dashboardUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/dashboard`;
        
        const mailOptions = {
            from: {
            name: 'Brainiacs Team',
            address: this.configService.get<string>('EMAIL_USER'),
            },
            to: email,
            subject: 'Welcome to Brainiacs!',
            html: this.getWelcomeEmailTemplate(displayName, dashboardUrl),
            text: `Welcome to Brainiacs!\n\nHello ${displayName},\n\nYour email has been verified! You're all set to start your quiz journey.\n\nVisit your dashboard: ${dashboardUrl}`,
        };

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Welcome email sent to ${email}`);
        } catch (error) {
        this.logger.error(`Failed to send welcome email to ${email}:`, error);
        }
    }

    /**
     * Send security alert for suspicious activity
     * @param email - User's email address
     * @param displayName - User's display name
     * @param ipAddress - IP address of the request
     */
    async sendSecurityAlert(
        email: string,
        displayName: string,
        ipAddress?: string,
    ): Promise<void> {
        try {
        const timestamp = this.getCurrentTimestamp();

        const mailOptions = {
            from: {
            name: 'Brainiacs Security',
            address: this.configService.get<string>('EMAIL_USER'),
            },
            to: email,
            subject: 'Security Alert - Unusual Activity Detected',
            html: this.getSecurityAlertTemplate(displayName, timestamp, ipAddress),
            text: `Security Alert\n\nHello ${displayName},\n\nWe detected unusual activity on your account at ${timestamp}${ipAddress ? ` from IP: ${ipAddress}` : ''}.\n\nIf this wasn't you, please secure your account immediately.`,
        };

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Security alert sent to ${email}`);
        } catch (error) {
        this.logger.error(`Failed to send security alert to ${email}:`, error);
        }
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private getCurrentTimestamp(): string {
        return new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
        });
    }

    private getPasswordResetTemplate(displayName: string, resetUrl: string): string {
        return this.buildEmailTemplate(
        'Password Reset',
        displayName,
        'You requested to reset your password. Click the button below to create a new password.',
        `
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="info-box">
            <p><strong>This link expires in 1 hour</strong></p>
            <p style="margin-top: 10px;">For security reasons, this password reset link can only be used once.</p>
            </div>
            <div class="security-note">
            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
        `
        );
    }

    private getPasswordChangedTemplate(displayName: string, timestamp: string): string {
        return this.buildEmailTemplate(
        '✅ Password Changed',
        displayName,
        'Your password has been changed successfully.',
        `
            <div class="info-box">
            <p><strong>Changed at:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> All active sessions have been logged out</p>
            </div>
            <div class="security-note">
            <strong>Important:</strong> If you didn't make this change, your account may be compromised. Please contact our support team immediately at support@brainiacs.com
            </div>
        `,
        '#28a745'
        );
    }

    private getVerificationEmailTemplate(displayName: string, verificationUrl: string): string {
        return this.buildEmailTemplate(
        'Verify Your Email',
        displayName,
        'Thank you for joining Brainiacs! Please verify your email address to activate your account.',
        `
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <div class="info-box">
            <p><strong>This link expires in 24 hours</strong></p>
            <p style="margin-top: 10px;">If you didn't create an account with Brainiacs, you can safely ignore this email.</p>
            </div>
        `,
        '#667eea'
        );
    }

    private getWelcomeEmailTemplate(displayName: string, dashboardUrl: string): string {
        return this.buildEmailTemplate(
        '🎉 Welcome to Brainiacs!',
        displayName,
        'Your email has been verified! You\'re all set to start your quiz journey and compete with other brilliant minds.',
        `
            <div class="info-box">
            <p><strong>What's next?</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Take your first quiz</li>
                <li>Compete on the leaderboard</li>
                <li>Track your progress</li>
                <li>Earn achievements</li>
            </ul>
            </div>
            <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
        `,
        '#28a745'
        );
    }

    private buildEmailTemplate(
        title: string,
        displayName: string,
        message: string,
        content: string,
        accentColor: string = '#667eea'
    ): string {
        return `
        <!DOCTYPE html>
        <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
                }
                .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                background: linear-gradient(135deg, ${accentColor} 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                }
                .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
                }
                .content {
                padding: 30px 20px;
                }
                .greeting {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #333;
                }
                .message {
                font-size: 16px;
                margin-bottom: 20px;
                color: #555;
                }
                .info-box {
                background-color: #f8f9fa;
                border-left: 4px solid ${accentColor};
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                }
                .info-box p {
                margin: 5px 0;
                font-size: 14px;
                color: #666;
                }
                .info-box strong {
                color: #333;
                }
                .info-box ul {
                color: #666;
                font-size: 14px;
                }
                .security-note {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 4px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                color: #856404;
                }
                .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #dee2e6;
                }
                .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, ${accentColor} 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                margin: 15px 0;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <h1>${title}</h1>
                </div>
                <div class="content">
                <p class="greeting">Hello ${displayName}! 👋</p>
                <p class="message">${message}</p>
                ${content}
                </div>
                <div class="footer">
                <p>This is an automated notification from Brainiacs Quiz Platform.</p>
                <p>© ${new Date().getFullYear()} Brainiacs. All rights reserved.</p>
                <p style="margin-top: 10px;">
                    <a href="#" style="color: ${accentColor}; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
                    <a href="#" style="color: ${accentColor}; text-decoration: none; margin: 0 10px;">Terms of Service</a> |
                    <a href="#" style="color: ${accentColor}; text-decoration: none; margin: 0 10px;">Contact Support</a>
                </p>
                </div>
            </div>
            </body>
        </html>
        `;
    }

    private getPlainTextEmail(
        displayName: string,
        actionType: string,
        timestamp: string,
    ): string {
        return `
    Hello ${displayName}!

    ${actionType} Notification - Brainiacs Quiz Platform

    Action: ${actionType}
    Time: ${timestamp}
    New tokens: Generated ✓

    If you didn't perform this action, please secure your account immediately.

    ---
    © ${new Date().getFullYear()} Brainiacs. All rights reserved.
    This is an automated security notification.
        `.trim();
    }

    private getSecurityAlertTemplate(
        displayName: string,
        timestamp: string,
        ipAddress?: string,
    ): string {
        return `
        <!DOCTYPE html>
        <html>
            <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <h1>⚠️ Security Alert</h1>
                </div>
                <div class="content">
                <p>Hello ${displayName},</p>
                <p>We detected unusual activity on your Brainiacs account.</p>
                <div class="alert-box">
                    <p><strong>Time:</strong> ${timestamp}</p>
                    ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
                </div>
                <p>If this wasn't you, please secure your account immediately by changing your password.</p>
                </div>
            </div>
            </body>
        </html>
        `;
    }
}
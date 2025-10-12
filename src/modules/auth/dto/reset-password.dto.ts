import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token from email',
        example: 'a1b2c3d4e5f6...',
    })
    @IsString()
    @IsNotEmpty({ message: 'Reset token is required' })
    token: string;

    @ApiProperty({
        description: 'New password (min 8 characters, must contain uppercase, lowercase, number, and special character)',
        example: 'NewSecureP@ss123',
    })
    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        },
    )
    newPassword: string;
}
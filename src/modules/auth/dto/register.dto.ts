import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        example: 'johndoe',
        description: 'Unique username (3-20 characters, alphanumeric and underscores only)',
        minLength: 3,
        maxLength: 20,
    })
    @IsString()
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    @MaxLength(20, { message: 'Username must not exceed 20 characters' })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers, and underscores',
    })
    username: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'User display name',
    })
    @IsString()
    @MinLength(2, { message: 'Display name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Display name must not exceed 50 characters' })
    displayName: string;

    @ApiProperty({
        example: 'SecurePassword123!',
        description: 'Password (min 8 characters, must include uppercase, lowercase, number, and special character)',
        minLength: 8,
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
        message: 'Password must contain uppercase, lowercase, number, and special character',
        },
    )
    password: string;
}
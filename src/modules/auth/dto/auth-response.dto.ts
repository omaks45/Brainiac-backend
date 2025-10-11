// src/modules/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    _id: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiProperty({ example: 'johndoe' })
    username: string;

    @ApiProperty({ example: 'John Doe' })
    displayName: string;

    @ApiProperty({ example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe' })
    avatar: string;

    @ApiProperty({ example: 'user' })
    role: string;
}

export class AuthResponseDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT access token',
    })
    accessToken: string;

    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT refresh token',
    })
    refreshToken: string;

    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
    @ApiProperty({
        description: 'Email verification token from email',
        example: 'a1b2c3d4e5f6...',
    })
    @IsString()
    @IsNotEmpty({ message: 'Verification token is required' })
    token: string;
}
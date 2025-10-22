
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsEnum } from 'class-validator';
import { QuizCategory, QuizDifficulty } from '../../quizzes/dto/generate-quiz.dto';

export class CreateChallengeDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'User ID to challenge',
    })
    @IsMongoId()
    challengedUserId: string;

    @ApiProperty({
        enum: QuizCategory,
        example: QuizCategory.SOFTWARE_ENGINEERING,
    })
    @IsEnum(QuizCategory)
    category: QuizCategory;

    @ApiProperty({
        enum: QuizDifficulty,
        example: QuizDifficulty.MEDIUM,
    })
    @IsEnum(QuizDifficulty)
    difficulty: QuizDifficulty;
}
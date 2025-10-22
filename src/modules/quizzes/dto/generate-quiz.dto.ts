// src/modules/quizzes/dto/generate-quiz.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, Max } from 'class-validator';

export enum QuizCategory {
    SOFTWARE_ENGINEERING = 'software-engineering',
    MATHEMATICS = 'mathematics',
    DATA_SCIENCE = 'data-science',
    PRODUCT_DESIGN = 'product-design',
    DATA_ANALYTICS = 'data-analytics',
    SOCIAL_SCIENCE = 'social-science',
    ART_HUMANITIES = 'art-humanities',
    ECONOMICS = 'economics',
}

export enum QuizDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

export class GenerateQuizDto {
    @ApiProperty({
        enum: QuizCategory,
        example: QuizCategory.SOFTWARE_ENGINEERING,
        description: 'Quiz category',
    })
    @IsEnum(QuizCategory, { message: 'Invalid category' })
    category: QuizCategory;

    @ApiProperty({
        enum: QuizDifficulty,
        example: QuizDifficulty.MEDIUM,
        description: 'Quiz difficulty level',
    })
    @IsEnum(QuizDifficulty, { message: 'Invalid difficulty' })
    difficulty: QuizDifficulty;

    @ApiProperty({
        example: 10,
        description: 'Number of questions to generate',
        minimum: 5,
        maximum: 20,
    })
    @IsNumber()
    @Min(5, { message: 'Minimum 5 questions required' })
    @Max(20, { message: 'Maximum 20 questions allowed' })
    numberOfQuestions: number;
}
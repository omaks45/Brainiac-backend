// src/modules/quizzes/dto/query-quizzes.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizCategory, QuizDifficulty } from './generate-quiz.dto';

export class QueryQuizzesDto {
    @ApiPropertyOptional({ enum: QuizCategory })
    @IsOptional()
    @IsEnum(QuizCategory)
    category?: QuizCategory;

    @ApiPropertyOptional({ enum: QuizDifficulty })
    @IsOptional()
    @IsEnum(QuizDifficulty)
    difficulty?: QuizDifficulty;

    @ApiPropertyOptional({ example: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}
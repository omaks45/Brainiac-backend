// src/modules/quiz-attempts/dto/submit-quiz.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SubmitAnswerDto } from './submit-answer.dto';

export class SubmitQuizDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'Quiz ID',
    })
    @IsMongoId()
    quizId: string;

    @ApiProperty({
        type: [SubmitAnswerDto],
        description: 'Array of answers for all questions',
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SubmitAnswerDto)
    answers: SubmitAnswerDto[];
}
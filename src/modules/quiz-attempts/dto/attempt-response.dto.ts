
import { ApiProperty } from '@nestjs/swagger';

export class AnswerResultDto {
    @ApiProperty({ example: 0 })
    questionIndex: number;

    @ApiProperty({ example: 2 })
    selectedAnswer: number;

    @ApiProperty({ example: 1 })
    correctAnswer: number;

    @ApiProperty({ example: true })
    isCorrect: boolean;

    @ApiProperty({ example: 'React is a JavaScript library for building user interfaces' })
    explanation: string;

    @ApiProperty({ example: 10 })
    pointsEarned: number;

    @ApiProperty({ example: 25 })
    timeSpent: number;
}

export class AttemptResponseDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    _id: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    quizId: string;

    @ApiProperty({ example: 85 })
    score: number;

    @ApiProperty({ example: 85 })
    percentage: number;

    @ApiProperty({ example: 10 })
    totalQuestions: number;

    @ApiProperty({ example: 8 })
    correctAnswers: number;

    @ApiProperty({ example: 320 })
    duration: number;

    @ApiProperty({ type: [AnswerResultDto] })
    answers: AnswerResultDto[];

    @ApiProperty({ example: '2024-01-10T10:30:00Z' })
    completedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
    @ApiProperty({ example: 'What is React?' })
    questionText: string;

    @ApiProperty({ example: ['A library', 'A framework', 'A language', 'A database'] })
    options: string[];

    @ApiProperty({ example: 0, description: 'Correct answer index (only in results)' })
    correctAnswerIndex?: number;

    @ApiProperty({ example: 'React is a JavaScript library' })
    explanation?: string;

    @ApiProperty({ example: 10 })
    points: number;

    @ApiProperty({ example: 30 })
    timeLimit: number;
}

export class QuizResponseDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    _id: string;

    @ApiProperty({ example: 'Software Engineering Quiz - Medium' })
    title: string;

    @ApiProperty({ example: 'software-engineering' })
    category: string;

    @ApiProperty({ example: 'medium' })
    difficulty: string;

    @ApiProperty({ type: [QuestionResponseDto] })
    questions: QuestionResponseDto[];

    @ApiProperty({ example: 150 })
    totalPoints: number;

    @ApiProperty({ example: 8 })
    estimatedDuration: number;

    @ApiProperty({ example: '2024-01-10T10:30:00Z' })
    createdAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';

export class ChallengeScoreDto {
    @ApiProperty()
    userId: string;

    @ApiProperty()
    score: number;

    @ApiProperty()
    percentage: number;

    @ApiProperty()
    completed: boolean;

    @ApiProperty()
    completedAt?: Date;
}

export class ChallengeResponseDto {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    challengerId: any;

    @ApiProperty()
    challengedId: any;

    @ApiProperty()
    quizId: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    category: string;

    @ApiProperty()
    difficulty: string;

    @ApiProperty({ type: ChallengeScoreDto })
    challengerScore: ChallengeScoreDto;

    @ApiProperty({ type: ChallengeScoreDto })
    challengedScore: ChallengeScoreDto;

    @ApiProperty()
    winnerId?: string;

    @ApiProperty()
    isDraw: boolean;

    @ApiProperty()
    expiresAt: Date;

    @ApiProperty()
    createdAt: Date;
}
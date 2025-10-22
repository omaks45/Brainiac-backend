
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsMongoId, Min, Max } from 'class-validator';

export class SubmitAnswerDto {
    @ApiProperty({
        example: 0,
        description: 'Index of the question being answered',
    })
    @IsNumber()
    @Min(0)
    questionIndex: number;

    @ApiProperty({
        example: 2,
        description: 'Index of the selected answer (0-3)',
    })
    @IsNumber()
    @Min(0)
    @Max(3)
    selectedAnswer: number;

    @ApiProperty({
        example: 25,
        description: 'Time spent on this question in seconds',
    })
    @IsNumber()
    @Min(0)
    timeSpent: number;
}
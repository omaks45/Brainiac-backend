
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsMongoId, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAttemptsDto {
    @ApiPropertyOptional({ description: 'Filter by quiz ID' })
    @IsOptional()
    @IsMongoId()
    quizId?: string;

    @ApiPropertyOptional({ example: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { isValidObjectId } from 'mongoose';
import { QuizAttemptsService } from './quiz-attempts.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QueryAttemptsDto } from './dto/query-attempts.dto';
import { AttemptResponseDto } from './dto/attempt-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('quiz-attempts')
@Controller('quiz-attempts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  //POST routes first

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit quiz answers and get results' })
  @ApiResponse({ status: 200, description: 'Quiz graded successfully', type: AttemptResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid submission' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async submitQuiz(
    @CurrentUser() user: any,
    @Body() submitQuizDto: SubmitQuizDto,
  ) {
    return this.quizAttemptsService.submitQuiz(user._id, submitQuizDto);
  }

  //Named GET routes BEFORE /:id wildcard

  @Get()
  @ApiOperation({ summary: 'Get user quiz attempt history' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of attempts' })
  async getUserAttempts(
    @CurrentUser() user: any,
    @Query() query: QueryAttemptsDto,
  ) {
    return this.quizAttemptsService.getUserAttempts(user._id, query);
  }

  @Get('stats')                  //Must be declared BEFORE @Get(':id')
  @ApiOperation({ summary: 'Get user quiz statistics' })
  @ApiResponse({ status: 200, description: 'Returns user quiz stats' })
  async getUserStats(@CurrentUser() user: any) {
    return this.quizAttemptsService.getUserStats(user._id);
  }

  //Wildcard /:id route LAST

  @Get(':id')                    //Always last — catches remaining GET /:id calls
  @ApiOperation({ summary: 'Get specific attempt details' })
  @ApiParam({ name: 'id', description: 'Attempt ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Returns attempt details with correct answers', type: AttemptResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid attempt ID format' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async getAttemptById(
    @CurrentUser() user: any,
    @Param('id') attemptId: string,
  ) {
    //Guard against invalid ObjectId before it reaches MongoDB
    if (!isValidObjectId(attemptId)) {
      throw new BadRequestException(
        `Invalid attempt ID: "${attemptId}" is not a valid MongoDB ObjectId`,
      );
    }
    return this.quizAttemptsService.getAttemptById(attemptId, user._id);
  }
}
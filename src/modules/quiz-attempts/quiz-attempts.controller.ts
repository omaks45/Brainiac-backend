
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit quiz answers and get results' })
  @ApiResponse({
    status: 200,
    description: 'Quiz graded successfully',
    type: AttemptResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid submission' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async submitQuiz(
    @CurrentUser() user: any,
    @Body() submitQuizDto: SubmitQuizDto,
  ) {
    return this.quizAttemptsService.submitQuiz(user._id, submitQuizDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user quiz attempt history' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of attempts',
  })
  async getUserAttempts(
    @CurrentUser() user: any,
    @Query() query: QueryAttemptsDto,
  ) {
    return this.quizAttemptsService.getUserAttempts(user._id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user quiz statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns user quiz stats',
  })
  async getUserStats(@CurrentUser() user: any) {
    return this.quizAttemptsService.getUserStats(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific attempt details' })
  @ApiParam({ name: 'id', description: 'Attempt ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns attempt details with correct answers',
    type: AttemptResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async getAttemptById(
    @CurrentUser() user: any,
    @Param('id') attemptId: string,
  ) {
    return this.quizAttemptsService.getAttemptById(attemptId, user._id);
  }
}
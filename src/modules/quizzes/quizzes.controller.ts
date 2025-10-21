
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
import { QuizzesService } from '../quizzes/services/quizzes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { QueryQuizzesDto } from './dto/query-quizzes.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new quiz using AI' })
  @ApiResponse({
    status: 201,
    description: 'Quiz successfully generated',
    type: QuizResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generateQuiz(@Body() generateQuizDto: GenerateQuizDto) {
    return this.quizzesService.generateQuiz(generateQuizDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of quizzes',
  })
  async getAllQuizzes(@Query() query: QueryQuizzesDto) {
    return this.quizzesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns quiz details (without answers)',
    type: QuizResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuizById(@Param('id') id: string) {
    return this.quizzesService.findById(id);
  }
}
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuizAttemptsService } from './quiz-attempts.service';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { UpdateQuizAttemptDto } from './dto/update-quiz-attempt.dto';

@Controller('quiz-attempts')
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  @Post()
  create(@Body() createQuizAttemptDto: CreateQuizAttemptDto) {
    return this.quizAttemptsService.create(createQuizAttemptDto);
  }

  @Get()
  findAll() {
    return this.quizAttemptsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizAttemptsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuizAttemptDto: UpdateQuizAttemptDto) {
    return this.quizAttemptsService.update(+id, updateQuizAttemptDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quizAttemptsService.remove(+id);
  }
}

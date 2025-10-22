import { Injectable } from '@nestjs/common';
import { CreateQuizAttemptDto } from './dto/submit-answer.dto';
import { UpdateQuizAttemptDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizAttemptsService {
  create(createQuizAttemptDto: CreateQuizAttemptDto) {
    return 'This action adds a new quizAttempt';
  }

  findAll() {
    return `This action returns all quizAttempts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quizAttempt`;
  }

  update(id: number, updateQuizAttemptDto: UpdateQuizAttemptDto) {
    return `This action updates a #${id} quizAttempt`;
  }

  remove(id: number) {
    return `This action removes a #${id} quizAttempt`;
  }
}

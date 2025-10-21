// src/modules/quizzes/quizzes.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from '../quizzes/services/quizzes.service';
import { AiQuizGeneratorService } from './services/ai-quiz-generator.service';
import { Quiz, QuizSchema } from './schemas/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService, AiQuizGeneratorService],
  exports: [QuizzesService],
})
export class QuizzesModule {}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuizAttempt, QuizAttemptDocument } from './schemas/quiz-attempt.schema';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QueryAttemptsDto } from './dto/query-attempts.dto';
import { QuizzesService } from '../quizzes/services/quizzes.service';

@Injectable()
export class QuizAttemptsService {
  private readonly logger = new Logger(QuizAttemptsService.name);

  constructor(
    @InjectModel(QuizAttempt.name)
    private quizAttemptModel: Model<QuizAttemptDocument>,
    private quizzesService: QuizzesService,
  ) {}

  async submitQuiz(userId: string, submitQuizDto: SubmitQuizDto) {
    const { quizId, answers } = submitQuizDto;

    // Get quiz with correct answers
    const quiz = await this.quizzesService.findByIdWithAnswers(quizId);

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Validate number of answers
    if (answers.length !== quiz.questions.length) {
      throw new BadRequestException(
        `Expected ${quiz.questions.length} answers, got ${answers.length}`,
      );
    }

    // Grade answers
    const gradedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[answer.questionIndex];
      
      if (!question) {
        throw new BadRequestException(`Invalid question index: ${answer.questionIndex}`);
      }

      const isCorrect = answer.selectedAnswer === question.correctAnswerIndex;
      const pointsEarned = isCorrect ? question.points : 0;

      return {
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        timeSpent: answer.timeSpent,
        pointsEarned,
      };
    });

    // Calculate results
    const score = gradedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const correctAnswers = gradedAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctAnswers / quiz.questions.length) * 100);
    const duration = gradedAnswers.reduce((sum, a) => sum + a.timeSpent, 0);

    // Create attempt
    const attempt = new this.quizAttemptModel({
      userId: new Types.ObjectId(userId),
      quizId: new Types.ObjectId(quizId),
      answers: gradedAnswers,
      score,
      percentage,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      duration,
      isCompleted: true,
      completedAt: new Date(),
    });

    const savedAttempt = await attempt.save();

    // Update quiz statistics
    await this.quizzesService.incrementAttempts(quizId);
    await this.quizzesService.updateAverageScore(quizId, percentage);

    this.logger.log(`Quiz attempt saved: ${savedAttempt._id}, Score: ${score}/${quiz.totalPoints}`);

    // Return results with explanations
    return this.formatAttemptResponse(savedAttempt, quiz);
  }

  async getUserAttempts(userId: string, query: QueryAttemptsDto) {
    const { quizId, page = 1, limit = 20 } = query;

    const filter: any = { userId: new Types.ObjectId(userId) };
    if (quizId) {
      filter.quizId = new Types.ObjectId(quizId);
    }

    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.quizAttemptModel
        .find(filter)
        .populate('quizId', 'title category difficulty totalPoints')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.quizAttemptModel.countDocuments(filter),
    ]);

    return {
      data: attempts,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttemptById(attemptId: string, userId: string) {
    const attempt = await this.quizAttemptModel
      .findOne({
        _id: new Types.ObjectId(attemptId),
        userId: new Types.ObjectId(userId),
      })
      .populate('quizId')
      .exec();

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const quiz = await this.quizzesService.findByIdWithAnswers(attempt.quizId.toString());
    
    return this.formatAttemptResponse(attempt, quiz);
  }

  async getUserStats(userId: string) {
    const attempts = await this.quizAttemptModel
      .find({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        totalTimeSpent: 0,
        bestScore: 0,
        bestPercentage: 0,
      };
    }

    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalPercentage = attempts.reduce((sum, a) => sum + a.percentage, 0);
    const totalTimeSpent = attempts.reduce((sum, a) => sum + a.duration, 0);
    const bestScore = Math.max(...attempts.map(a => a.score));
    const bestPercentage = Math.max(...attempts.map(a => a.percentage));

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(totalScore / attempts.length),
      averagePercentage: Math.round(totalPercentage / attempts.length),
      totalTimeSpent,
      bestScore,
      bestPercentage,
    };
  }

  private formatAttemptResponse(attempt: any, quiz: any) {
    const answersWithExplanations = attempt.answers.map((answer: any) => {
      const question = quiz.questions[answer.questionIndex];
      
      return {
        questionIndex: answer.questionIndex,
        questionText: question.questionText,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswerIndex,
        isCorrect: answer.isCorrect,
        explanation: question.explanation,
        pointsEarned: answer.pointsEarned,
        timeSpent: answer.timeSpent,
      };
    });

    return {
      _id: attempt._id,
      quizId: attempt.quizId,
      score: attempt.score,
      percentage: attempt.percentage,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      duration: attempt.duration,
      answers: answersWithExplanations,
      completedAt: attempt.completedAt,
    };
  }
}
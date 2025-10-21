// src/modules/quizzes/quizzes.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument } from '../schemas/quiz.schema';
import { AiQuizGeneratorService } from '../services/ai-quiz-generator.service';
import { GenerateQuizDto } from '../dto/generate-quiz.dto';
import { QueryQuizzesDto } from '../dto/query-quizzes.dto';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    private aiQuizGenerator: AiQuizGeneratorService,
  ) {}

  async generateQuiz(generateQuizDto: GenerateQuizDto): Promise<Quiz> {
    const { category, difficulty, numberOfQuestions } = generateQuizDto;

    this.logger.log(`Generating quiz: ${category}, ${difficulty}, ${numberOfQuestions} questions`);

    // Generate questions using AI
    const questions = await this.aiQuizGenerator.generateQuiz(
      category,
      difficulty,
      numberOfQuestions,
    );

    // Calculate totals
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = Math.ceil(
      questions.reduce((sum, q) => sum + q.timeLimit, 0) / 60,
    );

    // Create quiz
    const quiz = new this.quizModel({
      title: `${this.formatCategory(category)} Quiz - ${this.capitalize(difficulty)}`,
      category,
      difficulty,
      questions,
      totalPoints,
      estimatedDuration,
      createdBy: 'ai',
      isPublic: true,
      metadata: {
        timesAttempted: 0,
        averageScore: 0,
        aiModel: process.env.GEMINI_MODEL,
        generationDate: new Date(),
      },
    });

    const savedQuiz = await quiz.save();
    this.logger.log(`Quiz created successfully: ${savedQuiz._id}`);
    
    return savedQuiz;
  }

  async findAll(query: QueryQuizzesDto) {
    const { category, difficulty, page = 1, limit = 20 } = query;

    const filter: any = { isPublic: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (page - 1) * limit;

    const [quizzes, total] = await Promise.all([
      this.quizModel
        .find(filter)
        .select('-questions.correctAnswerIndex -questions.explanation') // Hide answers
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.quizModel.countDocuments(filter),
    ]);

    return {
      data: quizzes,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Quiz> {
    const quiz = await this.quizModel
      .findById(id)
      .select('-questions.correctAnswerIndex -questions.explanation') // Hide answers
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async findByIdWithAnswers(id: string): Promise<Quiz> {
    // Used internally for checking answers
    const quiz = await this.quizModel.findById(id).exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async incrementAttempts(quizId: string): Promise<void> {
    await this.quizModel
      .findByIdAndUpdate(quizId, {
        $inc: { 'metadata.timesAttempted': 1 },
      })
      .exec();
  }

  async updateAverageScore(quizId: string, newScore: number): Promise<void> {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) return;

    const currentAvg = quiz.metadata.averageScore || 0;
    const attempts = quiz.metadata.timesAttempted || 1;
    
    const newAvg = ((currentAvg * (attempts - 1)) + newScore) / attempts;

    await this.quizModel
      .findByIdAndUpdate(quizId, {
        $set: { 'metadata.averageScore': Math.round(newAvg) },
      })
      .exec();
  }

  private formatCategory(category: string): string {
    return category
      .split('-')
      .map(word => this.capitalize(word))
      .join(' ');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
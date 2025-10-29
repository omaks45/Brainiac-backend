
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Quiz, QuizDocument } from '../schemas/quiz.schema';
import { AiQuizGeneratorService } from '../services/ai-quiz-generator.service';
import { GenerateQuizDto } from '../dto/generate-quiz.dto';
import { QueryQuizzesDto } from '../dto/query-quizzes.dto';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);
  
  // Cache config values for performance
  private readonly geminiModel: string;
  private readonly defaultPageLimit: number;
  private readonly maxPageLimit: number;

  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    private aiQuizGenerator: AiQuizGeneratorService,
    private configService: ConfigService,
  ) {
    // Initialize cached config values
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    this.defaultPageLimit = this.configService.get<number>('DEFAULT_PAGE_LIMIT', 20);
    this.maxPageLimit = this.configService.get<number>('MAX_PAGE_LIMIT', 100);
  }

  async generateQuiz(generateQuizDto: GenerateQuizDto): Promise<QuizDocument> {
    const { category, difficulty, numberOfQuestions } = generateQuizDto;

    this.logger.log(
      `Generating quiz: ${category}, ${difficulty}, ${numberOfQuestions} questions`
    );

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

    // Create quiz with formatted title
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
        aiModel: this.geminiModel,
        generationDate: new Date(),
      },
    });

    const savedQuiz = await quiz.save();
    this.logger.log(`Quiz created successfully: ${savedQuiz._id}`);

    return savedQuiz;
  }

  async findAll(query: QueryQuizzesDto) {
    const { 
      category, 
      difficulty, 
      page = 1, 
      limit = this.defaultPageLimit 
    } = query;

    // Enforce max limit to prevent abuse
    const safeLimit = Math.min(limit, this.maxPageLimit);
    const safePage = Math.max(1, page); // Ensure page is at least 1

    // Build filter
    const filter: any = { isPublic: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (safePage - 1) * safeLimit;

    // Execute queries in parallel for performance
    const [quizzes, total] = await Promise.all([
      this.quizModel
        .find(filter)
        .select('-questions.correctAnswerIndex -questions.explanation') // Hide answers
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      this.quizModel.countDocuments(filter),
    ]);

    return {
      data: quizzes,
      meta: {
        currentPage: safePage,
        itemsPerPage: safeLimit,
        totalItems: total,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: safePage < Math.ceil(total / safeLimit),
        hasPrevPage: safePage > 1,
      },
    };
  }

  async findById(id: string): Promise<Quiz> {
    const quiz = await this.quizModel
      .findById(id)
      .select('-questions.correctAnswerIndex -questions.explanation') // Hide answers
      .lean()
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  async findByIdWithAnswers(id: string): Promise<QuizDocument> {
    // Used internally for checking answers
    const quiz = await this.quizModel.findById(id).exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  async incrementAttempts(quizId: string): Promise<void> {
    await this.quizModel
      .findByIdAndUpdate(
        quizId,
        { $inc: { 'metadata.timesAttempted': 1 } },
        { new: false }
      )
      .exec();
  }

  async updateAverageScore(quizId: string, newScore: number): Promise<void> {
    const quiz = await this.quizModel
      .findById(quizId)
      .select('metadata.averageScore metadata.timesAttempted')
      .lean()
      .exec();

    if (!quiz) {
      this.logger.warn(`Quiz ${quizId} not found when updating average score`);
      return;
    }

    const currentAvg = quiz.metadata?.averageScore || 0;
    const attempts = quiz.metadata?.timesAttempted || 1;

    // Calculate new average score
    const newAvg = ((currentAvg * (attempts - 1)) + newScore) / attempts;

    await this.quizModel
      .findByIdAndUpdate(
        quizId,
        { $set: { 'metadata.averageScore': Math.round(newAvg) } },
        { new: false }
      )
      .exec();
  }

  /**
   * Get quiz statistics
   */
  async getQuizStats(quizId: string) {
    const quiz = await this.quizModel
      .findById(quizId)
      .select('metadata totalPoints estimatedDuration')
      .lean()
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    return {
      timesAttempted: quiz.metadata?.timesAttempted || 0,
      averageScore: quiz.metadata?.averageScore || 0,
      totalPoints: quiz.totalPoints,
      estimatedDuration: quiz.estimatedDuration,
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private formatCategory(category: string): string {
    return category
      .split('-')
      .map(word => this.capitalize(word))
      .join(' ');
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
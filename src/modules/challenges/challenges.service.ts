
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Challenge, ChallengeDocument, ChallengeStatus } from './schemas/challenge.schema';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { QuizzesService } from '../quizzes/services/quizzes.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { PopulatedChallenge, PopulatedUser } from '../challenges/interfaces/populated-challenged.interface';
@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectModel(Challenge.name)
    private challengeModel: Model<ChallengeDocument>,
    private quizzesService: QuizzesService,
    private eventsGateway: EventsGateway,
  ) {}

  async createChallenge(challengerId: string, createChallengeDto: CreateChallengeDto) {
    const { challengedUserId, category, difficulty } = createChallengeDto;

    // Prevent self-challenge
    if (challengerId === challengedUserId) {
      throw new BadRequestException('You cannot challenge yourself');
    }

    // Generate quiz for challenge
    const quiz = await this.quizzesService.generateQuiz({
      category,
      difficulty,
      numberOfQuestions: 10, // Fixed 10 questions for challenges
    });

    // Create challenge
    const challenge = new this.challengeModel({
      challengerId: new Types.ObjectId(challengerId),
      challengedId: new Types.ObjectId(challengedUserId),
      quizId: quiz._id,
      category,
      difficulty,
      status: ChallengeStatus.PENDING,
      challengerScore: {
        userId: new Types.ObjectId(challengerId),
        score: 0,
        percentage: 0,
        completed: false,
      },
      challengedScore: {
        userId: new Types.ObjectId(challengedUserId),
        score: 0,
        percentage: 0,
        completed: false,
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const savedChallenge = await challenge.save();
     // Populate and cast to interface
    const populatedChallenge = await savedChallenge.populate([
      'challengerId',
      'challengedId',
    ]) as unknown as PopulatedChallenge;

    this.logger.log(`Challenge created: ${populatedChallenge._id}`);

    // Notify challenged user
    this.eventsGateway.emitToUser(challengedUserId, 'challenge:created', {
      challenge: {
        _id: populatedChallenge._id,
        challengerId: {
          _id: populatedChallenge.challengerId._id,
          displayName: populatedChallenge.challengerId.displayName,
          avatar: populatedChallenge.challengerId.avatar,
        },
        category: populatedChallenge.category,
        difficulty: populatedChallenge.difficulty,
        expiresAt: populatedChallenge.expiresAt,
      },
      message: `${populatedChallenge.challengerId.displayName} challenged you!`,
    });

    return populatedChallenge;
  }

  async acceptChallenge(challengeId: string, userId: string) {
    const challenge = await this.challengeModel.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.challengedId.toString() !== userId) {
      throw new BadRequestException('You are not the challenged user');
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestException('Challenge is not pending');
    }

    challenge.status = ChallengeStatus.ACCEPTED;
    challenge.acceptedAt = new Date();
    await challenge.save();

    this.logger.log(`Challenge accepted: ${challengeId}`);

    // Notify challenger
    this.eventsGateway.emitToUser(
      challenge.challengerId.toString(),
      'challenge:accepted',
      { challengeId, message: 'Your challenge was accepted!' },
    );

    return challenge;
  }

  async declineChallenge(challengeId: string, userId: string) {
    const challenge = await this.challengeModel.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.challengedId.toString() !== userId) {
      throw new BadRequestException('You are not the challenged user');
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestException('Challenge is not pending');
    }

    challenge.status = ChallengeStatus.DECLINED;
    await challenge.save();

    this.logger.log(`Challenge declined: ${challengeId}`);

    // Notify challenger
    this.eventsGateway.emitToUser(
      challenge.challengerId.toString(),
      'challenge:declined',
      { challengeId, message: 'Your challenge was declined' },
    );

    return challenge;
  }

  async getChallengeById(challengeId: string, userId: string) {
    const challenge = await this.challengeModel
      .findById(challengeId)
      .populate(['challengerId', 'challengedId', 'quizId'])
      .exec();

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Verify user is part of challenge
    const isParticipant =
      challenge.challengerId._id.toString() === userId ||
      challenge.challengedId._id.toString() === userId;

    if (!isParticipant) {
      throw new BadRequestException('You are not part of this challenge');
    }

    return challenge;
  }

  async getUserChallenges(userId: string, status?: ChallengeStatus) {
    const filter: any = {
      $or: [
        { challengerId: new Types.ObjectId(userId) },
        { challengedId: new Types.ObjectId(userId) },
      ],
    };

    if (status) {
      filter.status = status;
    }

    const challenges = await this.challengeModel
      .find(filter)
      .populate(['challengerId', 'challengedId'])
      .sort({ createdAt: -1 })
      .exec();

    return challenges;
  }

  // This will be called after a quiz attempt is submitted
  async recordChallengeAttempt(
    challengeId: string,
    userId: string,
    attemptId: string,
    score: number,
    percentage: number,
  ) {
    const challenge = await this.challengeModel.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const isChallenger = challenge.challengerId.toString() === userId;
    const isChallenged = challenge.challengedId.toString() === userId;

    if (!isChallenger && !isChallenged) {
      throw new BadRequestException('You are not part of this challenge');
    }

    // Update score
    if (isChallenger) {
      challenge.challengerScore.attemptId = new Types.ObjectId(attemptId);
      challenge.challengerScore.score = score;
      challenge.challengerScore.percentage = percentage;
      challenge.challengerScore.completed = true;
      challenge.challengerScore.completedAt = new Date();
    } else {
      challenge.challengedScore.attemptId = new Types.ObjectId(attemptId);
      challenge.challengedScore.score = score;
      challenge.challengedScore.percentage = percentage;
      challenge.challengedScore.completed = true;
      challenge.challengedScore.completedAt = new Date();
    }

    // Check if both completed
    if (
      challenge.challengerScore.completed &&
      challenge.challengedScore.completed
    ) {
      challenge.status = ChallengeStatus.COMPLETED;
      challenge.completedAt = new Date();

      // Determine winner
      if (challenge.challengerScore.score > challenge.challengedScore.score) {
        challenge.winnerId = challenge.challengerId;
      } else if (challenge.challengedScore.score > challenge.challengerScore.score) {
        challenge.winnerId = challenge.challengedId;
      } else {
        challenge.isDraw = true;
      }

      // Notify both users
      this.eventsGateway.emitToUsers(
        [challenge.challengerId.toString(), challenge.challengedId.toString()],
        'challenge:completed',
        {
          challengeId: challenge._id,
          winnerId: challenge.winnerId,
          isDraw: challenge.isDraw,
          scores: {
            challenger: challenge.challengerScore,
            challenged: challenge.challengedScore,
          },
        },
      );

      this.logger.log(`Challenge completed: ${challengeId}`);
    } else {
      // Notify the other user that one player has completed
      const otherUserId = isChallenger
        ? challenge.challengedId.toString()
        : challenge.challengerId.toString();

      this.eventsGateway.emitToUser(otherUserId, 'challenge:progress', {
        challengeId: challenge._id,
        message: 'Your opponent has completed the quiz!',
      });
    }

    await challenge.save();
    return challenge;
  }
}
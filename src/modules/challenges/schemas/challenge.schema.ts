// src/modules/challenges/schemas/challenge.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChallengeDocument = Challenge & Document;

export enum ChallengeStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    DECLINED = 'declined',
    EXPIRED = 'expired',
}

class ChallengeScore {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'QuizAttempt', default: null })
    attemptId?: Types.ObjectId;

    @Prop({ default: 0 })
    score: number;

    @Prop({ default: 0 })
    percentage: number;

    @Prop({ default: false })
    completed: boolean;

    @Prop()
    completedAt?: Date;
}

@Schema({ timestamps: true })
export class Challenge {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    challengerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    challengedId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
    quizId: Types.ObjectId;

    @Prop({
        type: String,
        enum: ChallengeStatus,
        default: ChallengeStatus.PENDING,
        index: true,
    })
    status: ChallengeStatus;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    difficulty: string;

    @Prop({ type: ChallengeScore })
    challengerScore: ChallengeScore;

    @Prop({ type: ChallengeScore })
    challengedScore: ChallengeScore;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    winnerId?: Types.ObjectId;

    @Prop({ default: false })
    isDraw: boolean;

    @Prop()
    expiresAt: Date;

    @Prop()
    acceptedAt?: Date;

    @Prop()
    completedAt?: Date;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);

// Indexes
ChallengeSchema.index({ challengerId: 1, status: 1 });
ChallengeSchema.index({ challengedId: 1, status: 1 });
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired
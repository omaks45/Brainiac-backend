
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizAttemptDocument = QuizAttempt & Document;

class Answer {
    @Prop({ required: true })
    questionIndex: number;

    @Prop({ required: true })
    selectedAnswer: number;

    @Prop({ required: true })
    isCorrect: boolean;

    @Prop({ required: true })
    timeSpent: number; // in seconds

    @Prop({ default: 0 })
    pointsEarned: number;
}

@Schema({ timestamps: true })
export class QuizAttempt {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
    quizId: Types.ObjectId;

    @Prop({ type: [Answer], required: true })
    answers: Answer[];

    @Prop({ required: true })
    score: number;

    @Prop({ required: true })
    percentage: number;

    @Prop({ required: true })
    totalQuestions: number;

    @Prop({ required: true })
    correctAnswers: number;

    @Prop({ required: true })
    duration: number; // Total time taken in seconds

    @Prop({ default: false })
    isCompleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Challenge', default: null })
    challengeId?: Types.ObjectId; // If part of a challenge

    @Prop()
    completedAt: Date;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);

// Indexes for better performance
QuizAttemptSchema.index({ userId: 1, createdAt: -1 });
QuizAttemptSchema.index({ quizId: 1, score: -1 });
QuizAttemptSchema.index({ userId: 1, quizId: 1 });
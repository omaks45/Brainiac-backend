// src/modules/quizzes/schemas/quiz.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

class Question {
    @Prop({ required: true })
    questionText: string;

    @Prop({ type: [String], required: true })
    options: string[];

    @Prop({ required: true, min: 0, max: 3 })
    correctAnswerIndex: number;

    @Prop({ required: true })
    explanation: string;

    @Prop({ required: true, default: 10 })
    points: number;

    @Prop({ required: true, default: 30 })
    timeLimit: number;
}

@Schema({ timestamps: true })
    export class Quiz {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true, index: true })
    category: string;

    @Prop({ required: true, enum: ['easy', 'medium', 'hard'], index: true })
    difficulty: string;

    @Prop({ type: [Question], required: true })
    questions: Question[];

    @Prop({ required: true })
    totalPoints: number;

    @Prop({ required: true })
    estimatedDuration: number; // in minutes

    @Prop({ default: 'ai' })
    createdBy: string; // 'ai' or userId

    @Prop({ default: true })
    isPublic: boolean;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({
        type: {
        timesAttempted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        aiModel: String,
        generationDate: Date,
        },
        default: {},
    })
    metadata: {
        timesAttempted: number;
        averageScore: number;
        aiModel?: string;
        generationDate?: Date;
    };
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Indexes for better query performance
QuizSchema.index({ category: 1, difficulty: 1 });
QuizSchema.index({ createdAt: -1 });
QuizSchema.index({ 'metadata.timesAttempted': -1 });
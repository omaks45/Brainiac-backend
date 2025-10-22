// src/modules/challenges/interfaces/populated-challenge.interface.ts
import { Types } from 'mongoose';

export interface PopulatedUser {
    _id: Types.ObjectId;
    displayName: string;
    username: string;
    email: string;
    avatar: string;
}

export interface PopulatedChallenge {
    _id: Types.ObjectId;
    challengerId: PopulatedUser;
    challengedId: PopulatedUser;
    quizId: Types.ObjectId;
    status: string;
    category: string;
    difficulty: string;
    challengerScore: any;
    challengedScore: any;
    winnerId?: Types.ObjectId;
    isDraw: boolean;
    expiresAt: Date;
    acceptedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    save(): Promise<any>;
}
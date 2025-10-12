// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
    email: string;

    @Prop({ required: true, unique: true, trim: true, index: true })
    username: string;

    @Prop({ required: true })
    displayName: string;

    @Prop({ required: false, select: false }) // Optional for Google OAuth users, hidden by default
    password?: string;

    @Prop({ default: null })
    googleId?: string;

    @Prop({ default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' })
    avatar: string;

    @Prop({ default: 'user', enum: ['user', 'admin', 'moderator'] })
    role: string;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ type: Object, default: {} })
    preferences: {
        favoriteCategories?: string[];
        difficulty?: string;
        notificationsEnabled?: boolean;
    };

    @Prop({
        type: {
        totalQuizzes: { type: Number, default: 0 },
        totalScore: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastActive: { type: Date, default: Date.now },
        },
        default: {
        totalQuizzes: 0,
        totalScore: 0,
        averageScore: 0,
        rank: 0,
        streak: 0,
        lastActive: new Date(),
        },
        _id: false,
    })
    stats: {
        totalQuizzes: number;
        totalScore: number;
        averageScore: number;
        rank: number;
        streak: number;
        lastActive: Date;
    };

    @Prop({ default: null, select: false })
    refreshToken?: string;

    // Password Reset Fields
    @Prop({ default: null, select: false })
    resetPasswordToken?: string;

    @Prop({ default: null })
    resetPasswordExpiry?: Date;

    // Email Verification Fields
    @Prop({ default: null, select: false })
    verificationToken?: string;

    @Prop({ default: null })
    verificationTokenExpiry?: Date;

    @Prop({ default: null })
    lastPasswordChange?: Date;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create compound indexes for better query performance
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ resetPasswordExpiry: 1 });
UserSchema.index({ verificationTokenExpiry: 1 });

// Add a pre-save hook to update lastPasswordChange when password is modified
UserSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;
    if (update && (update.password || update.$set?.password)) {
        if (update.$set) {
        update.$set.lastPasswordChange = new Date();
        } else {
        update.lastPasswordChange = new Date();
        }
    }
    next();
});

// Add pre-save middleware for direct document saves
UserSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        this.lastPasswordChange = new Date();
    }
    next();
});
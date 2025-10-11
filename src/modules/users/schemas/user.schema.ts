import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ _id: false })
class UserPreferences {
    @Prop({ type: [String], default: [] })
    favoriteCategories: string[];

    @Prop({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' })
    difficulty: string;

    @Prop({ type: Boolean, default: true })
    notificationsEnabled: boolean;
}

@Schema({ _id: false })
class UserStats {
    @Prop({ type: Number, default: 0 })
    totalQuizzes: number;

    @Prop({ type: Number, default: 0 })
    totalScore: number;

    @Prop({ type: Number, default: 0 })
    averageScore: number;

    @Prop({ type: Number, default: 0 })
    rank: number;

    @Prop({ type: Number, default: 0 })
    streak: number;

    @Prop({ type: Date })
    lastActive: Date;
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, unique: true, trim: true, minlength: 3, maxlength: 30 })
    username: string;

    @Prop({ required: true, trim: true })
    displayName: string;

    @Prop({ sparse: true, unique: true })
    googleId?: string;

    @Prop({ select: false })
    password?: string;

    @Prop({ default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' })
    avatar: string;

    @Prop({ type: UserPreferences, default: () => ({}) })
    preferences: UserPreferences;

    @Prop({ type: UserStats, default: () => ({}) })
    stats: UserStats;

    @Prop({ type: Boolean, default: false })
    isEmailVerified: boolean;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @Prop({ type: [String], default: ['user'] })
    roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ 'stats.rank': -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        if (!this.password) return false;
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Transform output - remove sensitive data
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        return {
            ...ret,
            id: ret._id,
            _id: undefined,
            __v: undefined,
            password: undefined
        };
    },
});
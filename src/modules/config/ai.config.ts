
import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
    provider: process.env.AI_PROVIDER || 'gemini',

    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
}));
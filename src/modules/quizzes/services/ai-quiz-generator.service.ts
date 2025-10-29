import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface QuizQuestion {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    points: number;
    timeLimit: number;
}

@Injectable()
export class AiQuizGeneratorService {
    private readonly logger = new Logger(AiQuizGeneratorService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;
    
    // Rate limiting for free tier (15 requests per minute)
    private requestQueue: Promise<any> = Promise.resolve();
    private lastRequestTime: number = 0;
    private readonly minRequestInterval: number = 4000; // 4 seconds between requests (safe margin)

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY not found in environment variables');
            throw new Error('Gemini API key is required');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);

        // Use the free tier model
        const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
        
        try {
            this.model = this.genAI.getGenerativeModel({
                model: modelName,
            });
            this.logger.log(`Gemini AI initialized with model: ${modelName}`);
        } catch (error) {
            this.logger.error(`Failed to initialize Gemini model: ${error.message}`);
            throw new Error('Failed to initialize AI model');
        }
    }

    /**
     * Rate-limited request wrapper
     */
    private async rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
        // Chain this request after the previous one
        this.requestQueue = this.requestQueue.then(async () => {
            // Calculate time to wait
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const waitTime = Math.max(0, this.minRequestInterval - timeSinceLastRequest);

            if (waitTime > 0) {
                this.logger.debug(`Rate limiting: waiting ${waitTime}ms before next request`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            // Execute the request
            this.lastRequestTime = Date.now();
            return requestFn();
        });

        return this.requestQueue;
    }

    async generateQuiz(
        category: string,
        difficulty: string,
        numberOfQuestions: number,
    ): Promise<QuizQuestion[]> {
        try {
            const prompt = this.buildPrompt(category, difficulty, numberOfQuestions);
            
            this.logger.log(`Generating ${numberOfQuestions} questions for ${category} (${difficulty})`);

            // Use rate-limited request
            const text = await this.rateLimitedRequest(async () => {
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });

            // Extract JSON from response
            const questions = this.parseResponse(text);

            // Validate questions
            if (!questions || questions.length === 0) {
                throw new Error('No questions generated');
            }

            this.logger.log(`Successfully generated ${questions.length} questions`);
            return questions;

        } catch (error) {
            this.logger.error(`Quiz generation failed: ${error.message}`);
            
            // Better error messages
            if (error.message.includes('404') || error.message.includes('not found')) {
                throw new InternalServerErrorException(
                    'AI model not available. Please contact support.',
                );
            }
            
            if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('rate limit')) {
                throw new InternalServerErrorException(
                    'AI service is temporarily busy. Please try again in a few seconds.',
                );
            }
            
            throw new InternalServerErrorException(
                'Failed to generate quiz. Please try again.',
            );
        }
    }

    private buildPrompt(
        category: string,
        difficulty: string,
        numberOfQuestions: number,
    ): string {
        const categoryContext = this.getCategoryContext(category);
        const difficultyGuidelines = this.getDifficultyGuidelines(difficulty);

        return `Generate exactly ${numberOfQuestions} multiple-choice quiz questions about ${category}.

${categoryContext}

Difficulty: ${difficulty}
${difficultyGuidelines}

IMPORTANT RULES:
1. Return ONLY a valid JSON array, no markdown, no extra text
2. Each question must have exactly 4 options
3. Only ONE correct answer per question
4. Options should be plausible but distinguishable
5. Explanations should be educational and clear
6. Time limits based on difficulty: easy=30s, medium=45s, hard=60s
7. Points based on difficulty: easy=10pts, medium=15pts, hard=20pts

JSON FORMAT (return ONLY this, nothing else):
[
{
    "questionText": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct",
    "points": 10,
    "timeLimit": 30
}
]

Generate ${numberOfQuestions} questions now:`;
    }

    private getCategoryContext(category: string): string {
        const contexts = {
            'software-engineering': 'Focus on programming concepts, algorithms, design patterns, software architecture, testing, and best practices.',
            'mathematics': 'Cover algebra, calculus, geometry, statistics, probability, and mathematical reasoning.',
            'data-science': 'Include machine learning, statistics, data analysis, data visualization, and Python/R concepts.',
            'product-design': 'Cover design principles, user research, prototyping, accessibility, design systems, and tools.',
            'data-analytics': 'Focus on data processing, SQL, business intelligence, visualization, and analytical thinking.',
            'social-science': 'Cover sociology, psychology, anthropology, and political science.',
            'art-humanities': 'Cover history, literature, philosophy, arts, and cultural studies.',
            'economics': 'Include microeconomics, macroeconomics, market systems, and economic theory.',
        };

        return contexts[category] || 'Cover fundamental concepts and practical applications.';
    }

    private getDifficultyGuidelines(difficulty: string): string {
        const guidelines = {
            easy: '- Basic concepts and definitions\n- Straightforward questions\n- Common knowledge in the field\n- Time: 30 seconds, Points: 10',
            medium: '- Applied knowledge and problem-solving\n- Scenario-based questions\n- Requires understanding concepts\n- Time: 45 seconds, Points: 15',
            hard: '- Advanced concepts and edge cases\n- Critical thinking required\n- Complex scenarios\n- Time: 60 seconds, Points: 20',
        };

        return guidelines[difficulty] || guidelines.medium;
    }

    private parseResponse(text: string): QuizQuestion[] {
        try {
            // Remove markdown code blocks if present
            let cleanText = text.trim();
            cleanText = cleanText.replace(/```json\n?/g, '');
            cleanText = cleanText.replace(/```\n?/g, '');
            cleanText = cleanText.trim();

            // Find JSON array
            const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }

            const questions = JSON.parse(jsonMatch[0]);

            // Validate structure
            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array');
            }

            // Validate each question
            return questions.map((q, index) => this.validateQuestion(q, index));

        } catch (error) {
            this.logger.error(`Failed to parse AI response: ${error.message}`);
            throw new Error('Invalid response format from AI');
        }
    }

    private validateQuestion(question: any, index: number): QuizQuestion {
        const required = ['questionText', 'options', 'correctAnswerIndex', 'explanation'];
        
        for (const field of required) {
            if (!question[field] && question[field] !== 0) {
                throw new Error(`Question ${index + 1} missing field: ${field}`);
            }
        }

        if (!Array.isArray(question.options) || question.options.length !== 4) {
            throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }

        if (question.correctAnswerIndex < 0 || question.correctAnswerIndex > 3) {
            throw new Error(`Question ${index + 1} has invalid correctAnswerIndex`);
        }

        return {
            questionText: question.questionText,
            options: question.options,
            correctAnswerIndex: question.correctAnswerIndex,
            explanation: question.explanation,
            points: question.points || 10,
            timeLimit: question.timeLimit || 30,
        };
    }
}
import { PartialType } from '@nestjs/mapped-types';
import { CreateQuizAttemptDto } from './create-quiz-attempt.dto';

export class UpdateQuizAttemptDto extends PartialType(CreateQuizAttemptDto) {}

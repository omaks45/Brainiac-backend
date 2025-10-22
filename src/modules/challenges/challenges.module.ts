
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { ChallengesGateway } from './challenges.gateway';
import { Challenge, ChallengeSchema } from './schemas/challenge.schema';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
    ]),
    QuizzesModule,
    JwtModule, // For WebSocket auth
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengesGateway, EventsGateway],
  exports: [ChallengesService],
})
export class ChallengesModule {}
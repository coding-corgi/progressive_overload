import { Module } from '@nestjs/common';
import { ChallengeService } from './challenges.service';
import { ChallengeController } from './challenges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge]), HttpModule],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class ChallengeModule {}

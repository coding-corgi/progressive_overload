import { Module } from '@nestjs/common';
import { ChallengeService } from './challenges.service';
import { ChallengeController } from './challenges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChallengeLogsService } from '../redis/challenges.redis';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge]),
    RedisModule,
    ClientsModule.registerAsync([
      {
        name: 'ACCOUNT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('ACCOUNT_SERVICE_MQ_URL')!],
            queue: 'account_queue',
            queueOptions: {
              durable: false,
            },
            noAck: true,
          },
        }),
      },
    ]),
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService, ChallengeLogsService],
  exports: [ChallengeService, ChallengeLogsService],
})
export class ChallengeModule {}

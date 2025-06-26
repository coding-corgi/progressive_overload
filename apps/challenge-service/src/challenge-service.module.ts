import { Module } from '@nestjs/common';
import { ChallengeServiceController } from './challenge-service.controller';
import { ChallengeServiceService } from './challenge-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChallengeModule } from './challenges/challenges.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        url: configService.get<string>('DATABASE_URL'),
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    HttpModule.register({
      baseURL: process.env.ACCOUNT_SERVICE_URL,
      timeout: 3000,
    }),
    ChallengeModule, //여기
  ],
  controllers: [ChallengeServiceController],
  providers: [ChallengeServiceService],
})
export class ChallengeServiceModule {}

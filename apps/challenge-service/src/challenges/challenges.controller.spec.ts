import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeController } from './challenges.controller';
import { ChallengeService } from './challenges.service';
import { HttpService } from '@nestjs/axios';
import { ChallengeLogsService } from '../redis/challenges.redis';

describe('ChallengeController', () => {
  let controller: ChallengeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeController],
      providers: [
        ChallengeService,
        {
          provide: 'ChallengeRepository',
          useValue: {}, // Mocking ChallengeRepository
        },
        { provide: HttpService, useValue: {} }, // Mocking HttpsService
        { provide: 'ACCOUNT_SERVICE', useValue: {} }, // Mocking Account Service
        { provide: ChallengeLogsService, useValue: {} }, // Mocking ChallengeLogsService
      ],
    }).compile();

    controller = module.get<ChallengeController>(ChallengeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

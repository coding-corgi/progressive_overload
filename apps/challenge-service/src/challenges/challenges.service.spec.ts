import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeService } from './challenges.service';
import { HttpService } from '@nestjs/axios';
import { ChallengeLogsService } from '../redis/challenges.redis';

describe('ChallengeService', () => {
  let service: ChallengeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        {
          provide: 'ChallengeRepository',
          useValue: {}, // Mocking ChallengeRepository
        },
        { provide: HttpService, useValue: {} }, // Mocking HttpsService
        {
          provide: 'ACCOUNT_SERVICE',
          useValue: {}, // Mocking UserRepository
        },
        { provide: ChallengeLogsService, useValue: {} }, // Mocking ChallengeLogsService
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

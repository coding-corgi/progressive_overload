import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { ChallengeLogsService, REDIS_PRFIX } from '../src/redis/challenges.redis';
import { RedisModule } from '../src/redis/redis.module';
import { Challenge } from '../src/challenges/entities/challenge.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockUserId = 1;
const mockData = [
  {
    id: 1,
    title: 'Test Challenge',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
    userId: mockUserId,
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Challenge Redis unit', () => {
  let redis: Redis;
  let service: ChallengeLogsService;
  // let repo: Repository<Challenge>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [
        ChallengeLogsService,
        {
          provide: getRepositoryToken(Challenge),
          useValue: {
            find: jest.fn().mockResolvedValue(mockData),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    redis = module.get<Redis>('REDIS_CLIENT');
    service = module.get<ChallengeLogsService>(ChallengeLogsService);
    // repo = module.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  });

  beforeEach(async () => {
    await redis.flushall();
  });
  afterAll(async () => {
    await redis.quit();
  });

  it('getRecentChallengesLogs - 캐싱 파싱 실패 시 삭제 후 DB 조회', async () => {
    const cacheKey = REDIS_PRFIX.cache(mockUserId);
    await redis.set(cacheKey, 'invalid json');

    const logs = await service.getRecentChallengesLogs(String(mockUserId));
    expect(logs).toEqual(mockData);

    const cached = await redis.exists(cacheKey);
    expect(cached).toBe(1);
  });

  it('logChallengecreation - 챌린지 생성 로그 저장', async () => {
    const challengeId = 1;
    const key = REDIS_PRFIX.log(mockUserId);

    await service.logChallengecreation(challengeId, mockUserId);

    const logs = await redis.lrange(key, 0, -1);
    expect(logs[0]).toContain(`${challengeId}|`);
  });

  it('getCachedPendingChallenge - 캐시된 Pending DTO 조회', async () => {
    const pendingKey = REDIS_PRFIX.pending(mockUserId);
    const mockDto = {
      title: 'Pending Challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      userId: mockUserId,
      description: 'Pending Description',
    };

    await redis.set(pendingKey, JSON.stringify(mockDto));
    const cached = await service.getCachedPendingChallenge(mockUserId);
    expect(cached).toEqual(mockDto);
  });

  it('getCachedPendingChallenge - 캐시된 Pending DTO가 없을 때', async () => {
    const key = REDIS_PRFIX.pending(mockUserId);
    await redis.set(key, 'invalid json');

    const cached = await service.getCachedPendingChallenge(mockUserId);
    expect(cached).toBeNull();

    const exists = await redis.exists(key);
    expect(exists).toBe(0);
  });

  it('getCachedPendingChallenge - 캐시가 없으면 null 반환', async () => {
    const key = REDIS_PRFIX.pending(mockUserId);
    await redis.del(key);

    const cached = await service.getCachedPendingChallenge(mockUserId);
    expect(cached).toBeNull();
  });
});

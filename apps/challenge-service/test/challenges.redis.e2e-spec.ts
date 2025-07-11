import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Server } from 'http';
import { Test } from '@nestjs/testing';
import { ChallengeServiceModule } from '../src/challenge-service.module';
import * as request from 'supertest';
import Redis from 'ioredis';

interface Challenge {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateChallengeDto {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  userId: number;
}

const accountServiceUrl = process.env.ACCOUNT_SERVICE_URL ?? 'http://localhost:3000';

describe('ChallengeRedisController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let redis: Redis;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ChallengeServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    redis = app.get<Redis>('REDIS_CLIENT');
    server = app.getHttpServer() as Server;

    const res = await request(accountServiceUrl)
      .post('/users')
      .send({
        email: `test+${Date.now()}@example.com`,
        password: '1234abcdefgh',
        name: `TestUser${Date.now()}`,
      });

    const body = res.body as { id: number };
    createdUserId = body.id;
  });

  it('GET /challenges/:id - 캐시 MISS 후 HIT 확인', async () => {
    const dto: CreateChallengeDto = {
      title: `Test Challenge ${Date.now()}`,
      description: 'This is a test challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: createdUserId,
    };

    await request(server).post('/challenges').send(dto).expect(201);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const challengeList = await request(server).get('/challenges').expect(200);
    const found = (challengeList.body as Challenge[]).find((challenge) => challenge.title === dto.title);
    expect(found).toBeDefined();

    const challengeId = found!.id;
    const redisKey = `challenge:${challengeId}`;
    await redis.del(redisKey);

    // 1차 요청 → MISS → Redis 저장됨
    await request(server).get(`/challenges/${challengeId}`).expect(200);

    // 2차 요청 → HIT
    await request(server).get(`/challenges/${challengeId}`).expect(200);

    const cached = await redis.get(redisKey);
    expect(cached).toBeDefined();
  });

  it('GET /challenges/log/:userId - 캐시 적중률 확인', async () => {
    const cacheKey = `cache:challenge:${createdUserId}`;
    await redis.del(cacheKey); // 캐시 초기화

    const dto: CreateChallengeDto = {
      title: `Test Challenge ${Date.now()}`,
      description: 'This is a test challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: createdUserId,
    };

    await request(server).post('/challenges').send(dto).expect(201);

    const first = await request(server).get(`/challenges/logs/${createdUserId}?count=1`).expect(200);
    const second = await request(server).get(`/challenges/logs/${createdUserId}?count=1`).expect(200);

    expect(second.body).toEqual(first.body);
    const cachedLogs = await redis.get(cacheKey);
    expect(cachedLogs).toBeDefined();
  });

  afterAll(async () => {
    await redis.quit();
    await app.close();
  });
});

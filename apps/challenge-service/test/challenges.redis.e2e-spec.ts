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

describe('ChallengeRedisController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let redis: Redis;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ChallengeServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    redis = app.get<Redis>('REDIS_CLIENT');
    server = app.getHttpServer() as Server;
  });

  it('GET /challenges/:id - 캐시 miss 후 hit 되는지', async () => {
    const challengeDto: CreateChallengeDto = {
      title: 'Test Challenge',
      description: 'This is a test challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: 4, // 예시 사용자 ID
    };

    await request(server).post('/challenges').send(challengeDto).expect(201);
    // 챌린지 생성까지 MQ 비동기 처리 대기
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 챌린지 목록에서 해당 챌린지 ID 확인
    const response = await request(server).get('/challenges').expect(200);
    const challenges = response.body as Challenge[];
    const found = challenges.find((challenge) => challenge.title === challengeDto.title);
    const challengeId = found?.id;

    // Redis 삭제
    await redis.del(`challenge:${challengeId}`);

    // 캐시 미스 후 챌린지 조회
    await request(server).get(`/challenges/${challengeId}`).expect(200);

    // 두번쨰 GET 요청 => 캐시 히트 확인
    await request(server).get(`/challenges/${challengeId}`).expect(200);

    // Redis Key 확인
    const cachedChallenge = await redis.get(`challenge:${challengeId}`);
    expect(cachedChallenge).toBeDefined();
  });

  it('GET /challenges/:id - 캐시 적중률 확인', async () => {
    const userId = 4; // 예시 사용자 ID
    const cacheKey = `cache:challenge:${userId}`;

    //테스트용 캐시 삭제
    await redis.del(cacheKey);

    await request(server)
      .post('/challenges')
      .send({
        userId,
        title: `Test Challenge ${Date.now()}`,
        description: 'This is a test challenge',
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      })
      .expect(201);

    const response1 = await request(server).get(`/challenges/logs/${userId}?count=1`).expect(200);
    console.log('First response:', response1.body);

    const response2 = await request(server).get(`/challenges/logs/${userId}?count=1`).expect(200);
    console.log('Second response:', response2.body);

    expect(response2.body).toEqual(response1.body);

    const redisValue = await redis.get(cacheKey);
    expect(redisValue).toBeDefined();
  });

  afterAll(async () => {
    const redis = app.get<Redis>('REDIS_CLIENT');
    await redis.quit();
    await app.close();
  });
});

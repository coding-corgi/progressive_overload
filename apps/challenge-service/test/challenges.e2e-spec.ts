import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import { ChallengeServiceModule } from '../src/challenge-service.module';
import * as request from 'supertest';

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

describe('ChallengeController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ChallengeServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    server = app.getHttpServer() as Server;

    const userRes = await request(accountServiceUrl)
      .post('/users')
      .send({
        email: `test+${Date.now()}@example.com`,
        password: '1234abcdefgh',
        name: 'TestUser',
      });

    const body = userRes.body as { id: number };
    createdUserId = body.id;
  });

  it('POST /challenges - 유효한 유저로 챌린지 생성 성공', async () => {
    const dto: CreateChallengeDto = {
      title: `Test Challenge ${Date.now()}`,
      description: 'This is a test challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: createdUserId,
    };

    const res = await request(server).post('/challenges').send(dto);
    expect(res.status).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const challengeList = await request(server).get('/challenges').expect(200);
    const found = (challengeList.body as Challenge[]).find((c) => c.title === dto.title);

    expect(found).toBeDefined();
    expect(found?.userId).toBe(dto.userId);
  });

  it('POST /challenges - 유효하지 않은 유저는 챌린지 생성 실패', async () => {
    const dto: CreateChallengeDto = {
      title: `Test Challenge ${Date.now()}`,
      description: 'This challenge should not be created',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: 9999,
    };

    const res = await request(server).post('/challenges').send(dto);
    expect(res.status).toBe(201); // 요청은 받되 실제로 생성은 안 됨 (낙관적 응답

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const challengeList = await request(server).get('/challenges').expect(200);
    const found = (challengeList.body as Challenge[]).find((c) => c.title === dto.title);

    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
  });
});

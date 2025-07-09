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

describe('ChallengeController (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ChallengeServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    server = app.getHttpServer() as Server;
  });

  it('/challenges (POST) - validate_user를 내보내고 유효하면 챌린지 생성', async () => {
    const challengeDto: CreateChallengeDto = {
      title: 'Test Challenge',
      description: 'This is a test challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: 4, // 예시 사용자 ID
    };

    // POST 요청으로 유저 검증 emit
    await request(server).post('/challenges').send(challengeDto).expect(201);

    // 챌린지 생성까지 MQ 비동기 처리 대기
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 챌린지 목록에서 생성된 챌린지 확인
    const response = await request(server).get('/challenges').expect(200);
    const challengs = response.body as Challenge[];

    // const found = response.body.find((challenge) => challenge.title === challengeDto.title);
    const found = challengs.find((challenge) => challenge.title === challengeDto.title);

    expect(found).toBeDefined();
    expect(found?.userId).toBe(challengeDto.userId);
  });

  it('/challenges (POST) - 유효하지 않은 userid로 챌린지 생성 실패', async () => {
    const InvalidUserId = 9999;
    const challengeDto: CreateChallengeDto = {
      title: 'Invalid User Challenge',
      description: 'This challenge should not be created',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      userId: InvalidUserId,
    };

    // POST 요청 => validate_user emit => user_not_found 이벤트 수신
    await request(server).post('/challenges').send(challengeDto).expect(201);

    // 챌린지 생성까지 MQ 비동기 처리 대기
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 챌린지 목록에서 해당 챌린지 없는지 확인
    const response = await request(server).get('/challenges').expect(200);
    const challenges = response.body as Challenge[];

    const found = challenges.find((challenge) => challenge.title === challengeDto.title);
    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
  });
});

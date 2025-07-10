import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/account-service.module';
import * as request from 'supertest';
import { Response } from 'supertest';
import { Server } from 'http';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let refreshToken: string;
  let accessToken: string;

  const testEmail = `refresh+${Date.now()}@example.com`;
  const testPassword = 'test1234';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    server = app.getHttpServer() as Server;

    await request(server).post('/users').send({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });

    const loginResponse: Response = await request(server).post('/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    const body = loginResponse.body as LoginResponse;

    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/refresh - 유효한 리프래쉬 토큰으로 새 토큰 발급 ', async () => {
    const response = await request(server)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(201);

    const body = response.body as LoginResponse;

    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  it('POST /auth/logout - 로그아웃 성공', async () => {
    const response = await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body).toEqual({ message: '로그아웃 성공' });
  });

  it('POST /auth/refresh - 로그아웃 후 리프래쉬 토큰으로 재발급 실패 401', async () => {
    await request(server).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(201);

    await request(server).post('/auth/refresh').set('Authorization', `Bearer ${refreshToken}`).expect(401);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/account-service.module';
import * as request from 'supertest';
import { Response } from 'supertest';
import { Server } from 'http';
import { access } from 'fs';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let refreshToken: string;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const server = app.getHttpServer() as Server;
    await request(server).post('/users').send({
      email: 'refresh@test.com',
      password: 'test1234',
      name: 'Test User',
    });

    const loginResponse: Response = await request(server)
      .post('/auth/login')
      .send({
        email: 'refresh@test.com',
        password: 'test1234',
      })
      .expect(201);

    accessToken = (loginResponse.body as LoginResponse).accessToken;
    refreshToken = (loginResponse.body as LoginResponse).refreshToken;
  });

  it('/auth/refresh (POST)- 리프래쉬 토큰과 함꼐 새로운 토큰 반환 ', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(201);

    const body = response.body as LoginResponse;

    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  it('/auth/logout (POST) - 로그아웃 성공', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body).toEqual({ message: '로그아웃 성공' });
  });

  it('/auth/refresh (POST) - 로그아웃 후 리프래쉬 토큰 무효화', async () => {
    const server = app.getHttpServer() as Server;

    // 로그아웃 요청
    await request(server).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(201);

    // 로그아웃 후 리프래쉬 토큰으로 새로운 토큰 요청 시도
    await request(server).post('/auth/refresh').set('Authorization', `Bearer ${refreshToken}`).expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});

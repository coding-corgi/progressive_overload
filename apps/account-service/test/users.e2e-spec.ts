import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/account-service.module';
import * as request from 'supertest';
import { Server } from 'http';
import { Response } from 'supertest';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let accessToken: string;
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    server = app.getHttpServer() as Server;

    await request(server).post('/users').send({
      email: testEmail,
      name: 'Test User',
      password: testPassword,
    });

    const loginResponse: Response = await request(server).post('/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    const body = loginResponse.body as LoginResponse;
    accessToken = body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users/me - 내 정보 조회 성공', async () => {
    const response = await request(server).get('/users/me').set('Authorization', `Bearer ${accessToken}`).expect(200);

    expect(response.body).toHaveProperty('email', testEmail);
    expect(response.body).toHaveProperty('id');
  });

  it('GET /users/me - 인증 없이 접근 시 401 반환', async () => {
    await request(server).get('/users/me').expect(401);
  });
});

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
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const server = app.getHttpServer() as Server;
    await request(server).post('/users').send({
      email: 'me@test.com',
      name: 'my',
      password: 'password123',
    });

    const loginResponse: Response = await request(server).post('/auth/login').send({
      email: 'me@test.com',
      password: 'password123',
    });

    accessToken = (loginResponse.body as LoginResponse).accessToken;
  });

  it('/users/me (GET) - 내 정보 조회 성공', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server).get('/users/me').set('Authorization', `Bearer ${accessToken}`).expect(200);

    expect(response.body).toHaveProperty('email', 'me@test.com');
    expect(response.body).toHaveProperty('id');
  });

  it('/users/me (GET) - 인증없이 요청시 실패', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).get('/users/me').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});

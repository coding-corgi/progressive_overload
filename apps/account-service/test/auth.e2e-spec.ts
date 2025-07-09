import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/account-service.module';
import request from 'supertest';
import { Response } from 'supertest';
import { Server } from 'http';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

describe('AuthController (e2e)', () => {
  // let app: INestApplication<App>;
  let app: INestApplication;
  let refreshToken: string;

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

    refreshToken = (loginResponse.body as LoginResponse).refreshToken;
  });

  it('/auth/refresh (POST)- ', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(201);

    const body = response.body as LoginResponse;

    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});

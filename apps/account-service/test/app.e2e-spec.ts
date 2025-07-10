import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/account-service.module';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'test1234';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login - 로그인 성공', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: test, password: testPassword })
      .expect(201);

    const body = response.body as LoginResponse;

    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });
});

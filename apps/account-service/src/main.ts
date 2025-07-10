import { NestFactory } from '@nestjs/core';
import { AppModule } from './account-service.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const MQ_URL = configService.get<string>('ACCOUNT_SERVICE_MQ_URL');
  const PORT = configService.get<number>('ACCOUNT_SERVICE_PORT') || 3000;

  // MQ 연결 설정
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [MQ_URL!],
      queue: 'account_queue',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Progressive Overload API')
    .setDescription('피트니스 챌린지 백엔드 API 문서')
    .setVersion('1.0')
    .addTag('Account')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Validation 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(PORT);
}
void bootstrap();

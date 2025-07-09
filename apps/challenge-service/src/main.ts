import { NestFactory } from '@nestjs/core';
import { ChallengeServiceModule } from './challenge-service.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ChallengeServiceModule);

  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('ACCOUNT_SERVICE_MQ_URL')!],
      queue: 'challenge_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('Progressive Overload API')
    .setDescription('피트니스 챌린지 백엔드 API 문서')
    .setVersion('1.0')
    .addTag('Challenge')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.CHALLENGE_SERVICE_PORT ?? 3000);
  console.log(`🚀 Account Service listening on port ${process.env.CHALLENGE_SERVICE_PORT}`);
}
void bootstrap();

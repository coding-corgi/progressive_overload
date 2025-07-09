import { NestFactory } from '@nestjs/core';
import { AppModule } from './account-service.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  console.log('✅ MQ 연결 시도 중 (account_queue)...');
  console.log('💡 ACCOUNT_SERVICE_MQ_URL:', configService.get<string>('ACCOUNT_SERVICE_MQ_URL'));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('ACCOUNT_SERVICE_MQ_URL')!],
      queue: 'account_queue',
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
    .addTag('Account')
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

  await app.listen(process.env.ACCOUNT_SERVICE_PORT ?? 3000);
  console.log(`🚀 Account Service listening on port ${process.env.ACCOUNT_SERVICE_PORT}`);
  console.log(`📬 Connected to MQ at ${configService.get('CHALLENGE_SERVICE_MQ_URL')}`);
}
void bootstrap();

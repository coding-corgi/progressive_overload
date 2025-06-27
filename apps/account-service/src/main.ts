import { NestFactory } from '@nestjs/core';
import { AppModule } from './account-service.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('CHALLENGE_SERVICE_URL')!],
      queue: 'account_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Account Service listening on port ${process.env.PORT ?? 3000}`);
  console.log(`📬 Connected to MQ at ${configService.get('CHALLENGE_SERVICE_URL')}`);
}
bootstrap();

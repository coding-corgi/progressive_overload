import { NestFactory } from '@nestjs/core';
import { ChallengeServiceModule } from './challenge-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ChallengeServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();

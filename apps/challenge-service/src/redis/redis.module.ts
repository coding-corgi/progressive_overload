import { Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

const redisClient = 'REDIS_CLIENT';
let redis: Redis;

@Module({
  providers: [
    {
      provide: redisClient,
      useFactory: () => {
        const host = process.env.REDIS_HOST ?? 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        redis = new Redis({ host, port });
        console.log(`✅ Redis 연결됨: ${host}:${port}`);
        return redis;
      },
    },
  ],
  exports: [redisClient],
})
export class RedisModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    if (redis?.status === 'ready') {
      try {
        await redis.quit();
        console.log('✅ Redis 연결 종료됨');
      } catch (err) {
        console.error('❌ Redis 연결 종료 중 오류 발생:', err);
      }
    }
  }
}

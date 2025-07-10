import { Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

let redis: Redis;

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        redis = new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
        return redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    try {
      if (redis && redis.status === 'ready') {
        await redis.quit();
      }
    } catch (error) {
      console.error('Error during Redis shutdown:', error);
    }
  }
}

import Redis from 'ioredis';
import { Challenge } from '../challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

const CHALLENGE_LOG_PREFIX = 'log:challenge';

@Injectable()
export class ChallengeLogsService {
  constructor(@InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>) {}

  async getRecentChallengesLogs(userId: string, count: number = 10) {
    const cacheKey = `${CHALLENGE_LOG_PREFIX}:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached) as Challenge[];
      } catch {
        await redis.del(cacheKey);
      }
    }

    const logs = await this.challengeRepository.find({
      where: { userId: Number(userId) },
      order: { createdAt: 'DESC' },
      take: count,
    });

    await redis.set(cacheKey, JSON.stringify(logs), 'EX', 30);

    return logs;
  }

  //deprecated
  async logChallengecreation(challengeId: number, userId: string | number) {
    const timestamp = new Date().toISOString();
    const key = `${CHALLENGE_LOG_PREFIX}:${userId}`;
    const value = `${challengeId}|${timestamp}`;
    await redis.lpush(key, value);
  }
}
// export const logChallengecreation = async (challengeId: number, userId: string | number) => {
//   const timestamp = new Date().toISOString();
//   const key = `${CHALLENGE_LOG_PREFIX}:${userId}`;
//   const value = `${challengeId}|${timestamp}`;
//   await redis.lpush(key, value);
// };

// export const getRecentChallengesLogs = async (userId: string, count: number = 10) => {
//   const key = `${CHALLENGE_LOG_PREFIX}:${userId}`;
//   return await redis.lrange(key, 0, count - 1);
// };

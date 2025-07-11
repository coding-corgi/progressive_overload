import { Challenge } from '../challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChallengeDto } from '../challenges/dto/create-challenge.dto';
import Redis from 'ioredis';

export const REDIS_PRFIX = {
  cache: (userId: string | number) => `cache:challenge:${userId}`,
  log: (userId: string | number) => `log:challenge:${userId}`,
  pending: (userId: string | number) => `pending:challenge:${userId}`,
};

@Injectable()
export class ChallengeLogsService {
  constructor(
    @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async getRecentChallengesLogs(userId: string, count: number = 10) {
    const cacheKey = REDIS_PRFIX.cache(userId);
    const cached = await this.redis.get(cacheKey);
    console.log('[📥] Redis 캐시 조회:', cacheKey);

    if (cached) {
      try {
        console.log('[✅] 캐시 HIT');
        return JSON.parse(cached) as Challenge[];
      } catch (err) {
        console.warn('[❌] 캐시 파싱 실패', err);
        await this.redis.del(cacheKey);
      }
    }

    console.log('[❌] 캐시 MISS, DB 조회');
    const logs = await this.challengeRepository.find({
      where: { userId: Number(userId) },
      order: { createdAt: 'DESC' },
      take: count,
    });

    await this.redis.set(cacheKey, JSON.stringify(logs), 'EX', 30);
    return logs;
  }

  async logChallengecreation(challengeId: number, userId: string | number) {
    const timestamp = new Date().toISOString();
    const key = REDIS_PRFIX.log(userId);
    const value = `${challengeId}|${timestamp}`;
    await this.redis.lpush(key, value);
    console.log('[📝] 챌린지 생성 로그 저장:', { key, value });
  }

  async cachePendingChallenge(userId: string | number, dto: CreateChallengeDto) {
    const key = REDIS_PRFIX.pending(userId);
    await this.redis.set(key, JSON.stringify(dto), 'EX', 60);
    console.log('[🧊] Pending DTO 캐시 저장:', key);
  }

  async getCachedPendingChallenge(userId: string | number) {
    const key = `pending:challenge:${userId}`;
    const cached = await this.redis.get(key);
    console.log('[🧊] Cached DTO:', cached);

    if (!cached) return null;

    try {
      return JSON.parse(cached) as CreateChallengeDto;
    } catch (err) {
      console.warn('[❌] 캐시 파싱 실패, 캐시 삭제:', err);
      await this.redis.del(key);
      return null;
    }
  }
}

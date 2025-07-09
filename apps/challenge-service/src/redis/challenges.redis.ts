import { Challenge } from '../challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChallengeDto } from '../challenges/dto/create-challenge.dto';
import { redis } from './redis.client';

const CHALLENGE_CACHE_PREFIX = 'cache:challenge'; // ✅ 캐시용
const CHALLENGE_LOG_PREFIX = 'log:challenge'; // ✅ 로그용

@Injectable()
export class ChallengeLogsService {
  constructor(@InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>) {}

  async getRecentChallengesLogs(userId: string, count: number = 10) {
    const cacheKey = `${CHALLENGE_CACHE_PREFIX}:${userId}`;
    const cached = await redis.get(cacheKey);
    console.log('[📥] Redis 캐시 조회:', cacheKey);

    if (cached) {
      try {
        console.log('[✅] 캐시 HIT');
        return JSON.parse(cached) as Challenge[];
      } catch {
        await redis.del(cacheKey);
      }
    }

    console.log('[❌] 캐시 MISS → DB 조회');

    const logs = await this.challengeRepository.find({
      where: { userId: Number(userId) },
      order: { createdAt: 'DESC' },
      take: count,
    });

    await redis.set(cacheKey, JSON.stringify(logs), 'EX', 30);

    return logs;
  }

  async logChallengecreation(challengeId: number, userId: string | number) {
    const timestamp = new Date().toISOString();
    const key = `${CHALLENGE_LOG_PREFIX}:${userId}`;
    const value = `${challengeId}|${timestamp}`;
    await redis.lpush(key, value);
  }

  async cachePendingChallenge(userId: string | number, dto: CreateChallengeDto) {
    const key = `pending:challenge:${userId}`;
    await redis.set(key, JSON.stringify(dto), 'EX', 60); // 60초 TTL 예시
  }

  async getCachedPendingChallenge(userId: string | number): Promise<CreateChallengeDto | null> {
    const key = `pending:challenge:${userId}`;
    const cached = await redis.get(key);
    console.log('[🧊] Cached DTO:', cached);
    if (!cached) return null;

    try {
      return JSON.parse(cached) as CreateChallengeDto;
    } catch {
      await redis.del(key);
      return null;
    }
  }
}

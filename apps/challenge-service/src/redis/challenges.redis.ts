import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

const CHALLENGE_LOG_PREFIX = 'log:challenge';

export const logChallengecreation = async (challengeId: number, userId: string | number) => {
  const timestamp = new Date().toISOString();
  const key = `${CHALLENGE_LOG_PREFIX}:${userId}`;
  const value = `${challengeId}|${timestamp}`;
  await redis.lpush(key, value);
};

export const getRecentChallengesLogs = async (userId: string, count: number = 10) => {
  const key = `${CHALLENGE_LOG_PREFIX}:${userId}`;
  return await redis.lrange(key, 0, count - 1);
};

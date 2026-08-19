import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('error', (err) => {
  logger.warn('Redis connection issue in rate limiter:', err.message);
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - ioredis sendCommand compatibility
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  handler: (req, res, next) => {
    next(new AppError('Too many search requests. Please slow down.', 429));
  },
});

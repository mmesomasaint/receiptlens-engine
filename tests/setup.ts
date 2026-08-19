// tests/setup.ts
import { ingestionQueue } from '../src/queues/ingestion.queue';
import { redisClient } from '../src/middlewares/rate-limiter.middleware';

process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.JWT_SECRET = 'test_jwt_secret_key_receiptlens_998822';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

afterAll(async () => {
  try {
    await ingestionQueue.close();
  } catch (_) {}
  try {
    await redisClient.quit();
  } catch (_) {}
});

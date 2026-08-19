// src/queues/ingestion.queue.ts
import { Queue } from 'bullmq';
import { config } from '../config';

export const INGESTION_QUEUE_NAME = 'receiptlens-sync-queue';

export const ingestionQueue = new Queue(INGESTION_QUEUE_NAME, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

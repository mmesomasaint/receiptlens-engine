// src/server.ts
import app from './app';
import { config } from './config';
import { initIngestionWorker } from './queues/worker';

const server = app.listen(config.port, () => {
  console.log(`
      ReceiptLens Ingestion & Semantic Search Engine
  ======================================================
      API Port           : ${config.port}
      Environment        : ${config.env}
      Extractor Service  : ${config.extractorServiceUrl}
      Redis Host         : ${config.redis.host}:${config.redis.port}
  ======================================================
  `);

  initIngestionWorker();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

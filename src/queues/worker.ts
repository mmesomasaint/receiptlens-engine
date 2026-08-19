// src/queues/worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient, DocumentCategory } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';
import { INGESTION_QUEUE_NAME } from './ingestion.queue';
import { config } from '../config';
import { googleService, IngestibleAttachment } from '../services/google.service';

const prisma = new PrismaClient();

export const initIngestionWorker = () => {
  const worker = new Worker(
    INGESTION_QUEUE_NAME,
    async (job: Job<{ userId: string }>) => {
      const { userId } = job.data;
      console.log(`[Worker] Starting document synchronization for user: ${userId}`);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error(`User not found: ${userId}`);

      const syncLog = await prisma.syncLog.create({
        data: { userId: user.id, status: 'PROCESSING' },
      });

      await prisma.user.update({ where: { id: userId }, data: { isSyncing: true } });

      try {
        const auth = googleService.getAuthenticatedClient(user.googleRefreshToken);

        // Ingest from Gmail & Google Drive in parallel
        const [gmailDocs, driveDocs] = await Promise.all([
          googleService.fetchGmailReceiptAttachments(auth),
          googleService.fetchDriveReceiptFiles(auth),
        ]);

        const allIncoming: IngestibleAttachment[] = [...gmailDocs, ...driveDocs];
        let ingestedCount = 0;
        let duplicateCount = 0;

        await fs.ensureDir(config.storage.localDocDir);

        for (const item of allIncoming) {
          // Check for existing document by checksum
          const existing = await prisma.document.findUnique({
            where: {
              userId_sourceChecksum: {
                userId: user.id,
                sourceChecksum: item.checksum,
              },
            },
          });

          if (existing) {
            duplicateCount++;
            continue;
          }

          // Persist physical file locally
          const storageFileName = `${user.id}_${item.checksum}_${item.fileName}`;
          const localFilePath = path.join(config.storage.localDocDir, storageFileName);
          await fs.writeFile(localFilePath, item.dataBuffer);

          // Extract OCR & dense semantic vector embedding from Python FastAPI service
          const form = new FormData();
          form.append('file', fs.createReadStream(localFilePath), item.fileName);

          const extractRes = await axios.post(
            `${config.extractorServiceUrl}/extract`,
            form,
            { headers: form.getHeaders(), timeout: 60000 }
          );

          const extData = extractRes.data;
          const vectorSql = `[${extData.embedding.join(',')}]`;

          // Execute raw SQL insert for pgvector embedding column support
          await prisma.$executeRaw`
            INSERT INTO "Document" (
              "id", "userId", "source", "sourceId", "sourceChecksum", "fileName", "fileSize", "mimeType",
              "storagePath", "category", "merchantName", "totalAmount", "currency", "documentDate", "taxYear",
              "rawOcrText", "embedding", "updatedAt"
            ) VALUES (
              gen_random_uuid()::text,
              ${user.id},
              ${item.source}::"DocumentSource",
              ${item.sourceId},
              ${item.checksum},
              ${item.fileName},
              ${item.size},
              ${item.mimeType},
              ${localFilePath},
              ${extData.category}::"DocumentCategory",
              ${extData.merchant_name},
              ${extData.total_amount},
              ${extData.currency},
              ${extData.document_date ? new Date(extData.document_date) : null},
              ${extData.tax_year},
              ${extData.raw_text},
              ${vectorSql}::vector,
              NOW()
            );
          `;

          ingestedCount++;
        }

        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'COMPLETED',
            scannedCount: allIncoming.length,
            ingestedCount,
            duplicateCount,
            completedAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { isSyncing: false, lastSyncAt: new Date() },
        });

        console.log(`✅ [Worker] User ${userId} sync complete. Ingested: ${ingestedCount}, Dupes: ${duplicateCount}`);
      } catch (err: any) {
        console.error(`❌ [Worker] Sync failed for ${userId}:`, err);
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: { status: 'FAILED', errorMessage: err.message, completedAt: new Date() },
        });
        await prisma.user.update({ where: { id: userId }, data: { isSyncing: false } });
        throw err;
      }
    },
    {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
      },
      concurrency: 3,
    }
  );
};

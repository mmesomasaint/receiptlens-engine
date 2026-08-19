// src/controllers/document.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { ingestionQueue } from '../queues/ingestion.queue';
import { vectorService } from '../services/vector.service';
import { AppError } from '../errors/app-error';

const prisma = new PrismaClient();

export class DocumentController {
  public async triggerSync(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      await ingestionQueue.add('sync-user-documents', { userId });

      res.status(202).json({
        status: 'success',
        message: 'Google Drive and Gmail document synchronization queued.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async searchDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const { q, taxYear, category } = req.query;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found.', 404);

      // Enforce 90-day search window limitation for FREE tier users
      const limitDays = user.tier === SubscriptionTier.FREE_90_DAYS ? 90 : undefined;

      const results = await vectorService.hybridSearch({
        userId,
        query: q as string,
        taxYear: taxYear ? parseInt(taxYear as string, 10) : undefined,
        category: category as string,
        limitDays,
      });

      res.status(200).json({
        status: 'success',
        results: results.length,
        data: {
          isLimitedTo90Days: !!limitDays,
          documents: results,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();

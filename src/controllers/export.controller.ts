// src/controllers/export.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { archiveService } from '../services/archive.service';
import { AppError } from '../errors/app-error';

const prisma = new PrismaClient();

export class ExportController {
  public async exportTaxYearZip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const taxYear = parseInt(req.params.taxYear, 10);

      if (isNaN(taxYear)) throw new AppError('Invalid tax year specified.', 400);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found.', 404);

      // Pro feature guard
      if (user.tier === SubscriptionTier.FREE_90_DAYS) {
        throw new AppError('Tax year 1-click ZIP export requires an active Pro subscription.', 403);
      }

      const zipFilePath = await archiveService.exportTaxYearZip(userId, taxYear);
      res.download(zipFilePath);
    } catch (error) {
      next(error);
    }
  }
}

export const exportController = new ExportController();

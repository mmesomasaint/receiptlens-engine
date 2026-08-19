// src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { stripeService } from '../services/stripe.service';
import { config } from '../config';
import { AppError } from '../errors/app-error';

const prisma = new PrismaClient();

export class SubscriptionController {
  public async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { plan, successUrl, cancelUrl } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found.', 404);

      const priceId =
        plan === 'ANNUAL' ? config.stripe.proAnnualPriceId : config.stripe.proMonthlyPriceId;

      const session = await stripeService.createSubscriptionCheckoutSession({
        userId: user.id,
        customerEmail: user.email,
        priceId,
        successUrl,
        cancelUrl,
      });

      res.status(200).json({ status: 'success', data: session });
    } catch (error) {
      next(error);
    }
  }

  public async getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          tier: true,
          subscriptionExpiresAt: true,
          lastSyncAt: true,
          isSyncing: true,
        },
      });

      res.status(200).json({ status: 'success', data: { subscription: user } });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();

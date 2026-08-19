// src/controllers/webhook.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';
import { stripeService } from '../services/stripe.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class WebhookController {
  public async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
    const sig = req.headers['stripe-signature'] as string;

    try {
      const event = stripeService.constructWebhookEvent(req.body, sig);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              tier: SubscriptionTier.PRO_ANNUAL,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });
          logger.info(`Upgraded user ${userId} to Pro subscription.`);
        }
      }

      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
}

export const webhookController = new WebhookController();

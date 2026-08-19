// src/services/stripe.service.ts
import Stripe from 'stripe';
import { config } from '../config';
import { AppError } from '../errors/app-error';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
  }

  public async createSubscriptionCheckoutSession(params: {
    userId: string;
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (config.env === 'development' && config.stripe.secretKey.startsWith('sk_test_mock')) {
      return {
        sessionId: `cs_mock_${Date.now()}`,
        url: `${params.successUrl}?session_id=mock_checkout_session`,
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: params.customerEmail,
        client_reference_id: params.userId,
        line_items: [{ price: params.priceId, quantity: 1 }],
        success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: params.cancelUrl,
        metadata: { userId: params.userId },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error: any) {
      throw new AppError(`Stripe Checkout Error: ${error.message}`, 502);
    }
  }

  public constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
    if (config.env === 'development' && config.stripe.webhookSecret.startsWith('whsec_mock')) {
      return typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString('utf-8'));
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
    } catch (error: any) {
      throw new AppError(`Invalid Stripe webhook signature: ${error.message}`, 400);
    }
  }
}

export const stripeService = new StripeService();

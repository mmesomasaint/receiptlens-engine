import { SubscriptionTier } from '@prisma/client';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

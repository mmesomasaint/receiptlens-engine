// src/routes/subscription.routes.ts
import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { CreateCheckoutSessionSchema } from '../schemas/export.schema';

const router = Router();

router.get('/status', requireAuth, subscriptionController.getSubscriptionStatus);
router.post('/checkout', requireAuth, validateRequest(CreateCheckoutSessionSchema), subscriptionController.createCheckout);

export default router;

// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import exportRoutes from './export.routes';
import subscriptionRoutes from './subscription.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/export', exportRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/webhooks', webhookRoutes);

export default router;

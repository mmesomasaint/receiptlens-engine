// src/routes/export.routes.ts
import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { ExportTaxYearSchema } from '../schemas/export.schema';

const router = Router();

router.get('/tax-year/:taxYear', requireAuth, validateRequest(ExportTaxYearSchema), exportController.exportTaxYearZip);

export default router;

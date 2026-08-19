// src/routes/document.routes.ts
import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { SearchDocumentSchema } from '../schemas/document.schema';

const router = Router();

router.post('/sync', requireAuth, documentController.triggerSync);
router.get('/search', requireAuth, validateRequest(SearchDocumentSchema), documentController.searchDocuments);

export default router;

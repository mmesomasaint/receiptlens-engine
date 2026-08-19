// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authController } from './controllers/auth.controller';
import { documentController } from './controllers/document.controller';
import { exportController } from './controllers/export.controller';
import { requireAuth } from './middlewares/auth.middleware';
import { apiRateLimiter } from './middlewares/rate-limiter.middleware';
import { errorHandler } from './errors/error-handler';
import { AppError } from './errors/app-error';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'receiptlens-engine' });
});

// OAuth 2.0 Routes
app.get('/api/v1/auth/google', authController.getGoogleAuthUrl);
app.get('/api/v1/auth/google/callback', authController.handleGoogleCallback);

// Document & Ingestion Routes (Authenticated & Rate Limited)
app.post('/api/v1/documents/sync', apiRateLimiter, requireAuth, documentController.triggerSync);
app.get('/api/v1/documents/search', apiRateLimiter, requireAuth, documentController.searchDocuments);
app.get('/api/v1/export/tax-year/:taxYear', apiRateLimiter, requireAuth, exportController.exportTaxYearZip);

// 404 Catch-All
app.use((req: Request, res: Response, next) => {
  next(new AppError(`Cannot locate requested route: ${req.originalUrl}`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;

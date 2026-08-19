// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key_receiptlens_998822',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', // 32 chars (256 bits)
  databaseUrl: process.env.DATABASE_URL || '',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/v1/auth/google/callback',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  },
  extractorServiceUrl: process.env.EXTRACTOR_SERVICE_URL || 'http://127.0.0.1:8001',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock',
    proMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_monthly_mock',
    proAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_annual_mock',
  },
  storage: {
    localDocDir: path.resolve(__dirname, '../../storage/documents'),
    localZipDir: path.resolve(__dirname, '../../storage/exports'),
  },
};

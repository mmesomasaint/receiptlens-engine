// tests/integration/export.test.ts
import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { config } from '../../src/config';
import { encryptionService } from '../../src/services/encryption.service';

const prisma = new PrismaClient();

describe('Tax Year Export Endpoint', () => {
  let freeToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'integration_export_test@receiptlens.local' },
      update: {},
      create: {
        email: 'integration_export_test@receiptlens.local',
        fullName: 'Export Test User',
        googleId: 'google_oauth_export_test',
        googleRefreshToken: encryptionService.encrypt('mock_refresh_token_export'),
        tier: SubscriptionTier.FREE_90_DAYS,
      },
    });

    testUserId = user.id;
    freeToken = jwt.sign(
      { userId: testUserId, email: user.email, tier: user.tier },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'integration_export_test@receiptlens.local' },
    });
    await prisma.$disconnect();
  });

  it('blocks 1-click ZIP export for free-tier users with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/export/tax-year/2025')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('requires an active Pro subscription');
  });
});

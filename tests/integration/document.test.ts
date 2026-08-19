// tests/integration/document.test.ts
import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { config } from '../../src/config';
import { encryptionService } from '../../src/services/encryption.service';

const prisma = new PrismaClient();

describe('GET /api/v1/documents/search Integration', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'integration_doc_test@receiptlens.local' },
      update: {},
      create: {
        email: 'integration_doc_test@receiptlens.local',
        fullName: 'Doc Test User',
        googleId: 'google_oauth_doc_test',
        googleRefreshToken: encryptionService.encrypt('mock_refresh_token_doc'),
        tier: SubscriptionTier.FREE_90_DAYS,
      },
    });

    testUserId = user.id;
    authToken = jwt.sign(
      { userId: testUserId, email: user.email, tier: user.tier },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'integration_doc_test@receiptlens.local' },
    });
    await prisma.$disconnect();
  });

  it('should reject unauthenticated search requests with 401', async () => {
    const res = await request(app).get('/api/v1/documents/search?q=Uber');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Unauthorized');
  });

  it('should accept search requests with a valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/documents/search?q=Home+Depot')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('documents');
    expect(res.body.data.isLimitedTo90Days).toBe(true);
  });
});

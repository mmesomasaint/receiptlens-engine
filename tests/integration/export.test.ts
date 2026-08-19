// tests/integration/export.test.ts
import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

describe('Tax Year Export Endpoint', () => {
  let freeToken: string;

  beforeAll(() => {
    freeToken = jwt.sign(
      { userId: 'free-user-id', email: 'free@receiptlens.local', tier: 'FREE_90_DAYS' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  it('blocks 1-click ZIP export for free-tier users with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/export/tax-year/2025')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('requires an active Pro subscription');
  });
});

// tests/integration/document.test.ts
import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

describe('GET /api/v1/documents/search Integration', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = jwt.sign(
      { userId: 'mock-user-id-1234', email: 'test@receiptlens.local', tier: 'FREE_90_DAYS' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
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

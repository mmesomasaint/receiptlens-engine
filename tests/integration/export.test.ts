// tests/integration/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('OAuth Endpoint Routing', () => {
  it('GET /api/v1/auth/google returns an authorization URL containing requested scopes', async () => {
    const res = await request(app).get('/api/v1/auth/google');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.authorizationUrl).toContain('accounts.google.com');
    expect(res.body.data.authorizationUrl).toContain('gmail.readonly');
  });

  it('GET /api/v1/auth/google/callback fails with 400 when no code is supplied', async () => {
    const res = await request(app).get('/api/v1/auth/google/callback');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing OAuth authorization code');
  });
});

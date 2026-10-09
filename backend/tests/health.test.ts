process.env.NODE_ENV = 'test';
import test, { describe, it, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { disconnectDB } from '../src/config/database.js';

describe('Health & System Endpoints', () => {
  after(async () => {
    await disconnectDB();
  });
  it('GET / should return 200 with service information and online status', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.service, 'Famora API');
    assert.strictEqual(res.body.data.status, 'online');
    assert.strictEqual(res.body.data.version, '1.0.0');
    assert.strictEqual(res.body.data.healthEndpoint, '/api/health');
  });

  it('GET /api/health should return 200 with detailed health metrics', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'online');
    assert.strictEqual(res.body.data.service, 'Famora API');
    assert.ok(typeof res.body.data.uptimeSeconds === 'number');
    assert.ok(res.body.data.timestamp);
    assert.ok(res.body.data.storageProvider);
  });

  it('GET /api/non-existent-endpoint should return 404 with standardized error response', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Route not found'));
  });
});

process.env.NODE_ENV = 'test';
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { updateProduceSchema } from '../src/controllers/produce.controller.js';

describe('User Profile Deletion & Produce Update Tests', () => {
  describe('Profile Deletion API Endpoints', () => {
    it('should reject unauthenticated DELETE /api/users/profile with 401', async () => {
      const res = await request(app).delete('/api/users/profile');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('should reject unauthenticated DELETE /api/auth/profile with 401', async () => {
      const res = await request(app).delete('/api/auth/profile');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('should reject unauthenticated DELETE /api/users/:id with 401', async () => {
      const res = await request(app).delete('/api/users/sample_user_id');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });

  describe('Produce Update Schema Resiliency', () => {
    it('should accept update with short or custom description', () => {
      const result = updateProduceSchema.safeParse({
        title: 'Fresh Carrots',
        description: 'Short note',
        pricePerUnit: 350,
        availableQuantity: 100,
      });
      assert.strictEqual(result.success, true);
    });

    it('should coerce string numbers to numbers for price and quantity', () => {
      const result = updateProduceSchema.safeParse({
        title: 'Organic Tomatoes',
        pricePerUnit: '450',
        availableQuantity: '200',
        minimumOrderQuantity: '10',
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(typeof result.data.pricePerUnit, 'number');
        assert.strictEqual(result.data.pricePerUnit, 450);
        assert.strictEqual(typeof result.data.availableQuantity, 'number');
        assert.strictEqual(result.data.availableQuantity, 200);
      }
    });

    it('should accept any valid category string and allow uppercase', () => {
      const result = updateProduceSchema.safeParse({
        title: 'Green Beans',
        category: 'VEGETABLES',
      });
      assert.strictEqual(result.success, true);
    });

    it('should reject negative price', () => {
      const result = updateProduceSchema.safeParse({
        pricePerUnit: -50,
      });
      assert.strictEqual(result.success, false);
    });
  });
});

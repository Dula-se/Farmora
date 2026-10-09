process.env.NODE_ENV = 'test';
import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { AppConfigService } from '../src/services/config.service.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

describe('AppConfigService & Dynamic Database Configuration', () => {
  before(async () => {
    try {
      await connectDB();
    } catch {
      // Allow testing with fallbacks if DB offline
    }
  });

  after(async () => {
    await disconnectDB();
  });

  it('should return defaultValue if configuration key does not exist', async () => {
    const fallback = { enabled: false, retries: 3 };
    const result = await AppConfigService.get('non_existent_test_key_123', fallback);
    assert.deepStrictEqual(result, fallback);
  });

  it('should return Stripe configuration with secretKey and publishableKey properties', async () => {
    const config = await AppConfigService.getStripeConfig();
    assert.ok(config !== null && typeof config === 'object');
    assert.ok('publishableKey' in config);
    assert.ok('secretKey' in config);
    assert.strictEqual(typeof config.publishableKey, 'string');
    assert.strictEqual(typeof config.secretKey, 'string');
  });

  it('should allow clearing in-memory cache and re-fetching', async () => {
    AppConfigService.clearCache();
    const config = await AppConfigService.getStripeConfig();
    assert.ok(config);
    assert.ok('publishableKey' in config);
  });
});

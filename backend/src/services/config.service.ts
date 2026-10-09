import { AppConfigModel } from '../models/AppConfig.js';
import { config as envConfig } from '../config/env.js';

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
}

// In-memory cache for high performance
const configCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export class AppConfigService {
  /**
   * Get configuration by key with caching and fallback
   */
  static async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    const cached = configCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    try {
      const doc = await AppConfigModel.findOne({ key });
      if (doc && doc.value !== undefined) {
        configCache.set(key, { value: doc.value, expiresAt: Date.now() + CACHE_TTL_MS });
        return doc.value as T;
      }
    } catch (err) {
      console.warn(`[AppConfigService] Error reading config "${key}" from DB:`, err);
    }

    return defaultValue as T;
  }

  /**
   * Set or update configuration in MongoDB
   */
  static async set(
    key: string,
    value: Record<string, any>,
    options?: { description?: string; category?: 'payment' | 'auth' | 'storage' | 'general'; isSecret?: boolean }
  ): Promise<void> {
    configCache.delete(key);
    await AppConfigModel.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          value,
          description: options?.description,
          category: options?.category || 'general',
          isSecret: options?.isSecret ?? false,
        },
      },
      { upsert: true, new: true }
    );
    configCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  /**
   * Clear in-memory config cache
   */
  static clearCache(): void {
    configCache.clear();
  }

  /**
   * Get Stripe configuration from database.
   * If not in database yet, falls back to env vars and seeds into DB.
   */
  static async getStripeConfig(): Promise<StripeConfig> {
    let stripeConf = await this.get<StripeConfig>('stripe');

    if (!stripeConf || !stripeConf.publishableKey) {
      // Seed from environment if available
      stripeConf = {
        secretKey: envConfig.stripe.secretKey || process.env.STRIPE_SECRET_KEY || '',
        publishableKey: envConfig.stripe.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
      };

      if (stripeConf.publishableKey || stripeConf.secretKey) {
        await this.set('stripe', stripeConf, {
          description: 'Stripe Payment Gateway Configuration',
          category: 'payment',
          isSecret: true,
        }).catch(() => {});
      }
    }

    return stripeConf || { secretKey: '', publishableKey: '' };
  }

  /**
   * Update Stripe credentials dynamically in the database
   */
  static async updateStripeConfig(secretKey: string, publishableKey: string): Promise<StripeConfig> {
    const updated: StripeConfig = {
      secretKey: secretKey.trim(),
      publishableKey: publishableKey.trim(),
    };
    await this.set('stripe', updated, {
      description: 'Stripe Payment Gateway Configuration',
      category: 'payment',
      isSecret: true,
    });
    return updated;
  }
}

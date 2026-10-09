import Stripe from 'stripe';

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

export const isStripeConfigured = Boolean(
  STRIPE_SECRET_KEY && (STRIPE_SECRET_KEY.startsWith('sk_live_') || STRIPE_SECRET_KEY.startsWith('sk_test_'))
);

// Initialize with configured secret key or fallback placeholder so Node doesn't throw on import
export const stripe: Stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder_key_not_configured');

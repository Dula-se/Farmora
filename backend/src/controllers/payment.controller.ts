import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AppConfigService } from '../services/config.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { OrderModel } from '../models/Order.js';

export class PaymentController {
  /**
   * Return the Stripe publishable key to clients from DB/env
   */
  static async getConfig(req: Request, res: Response) {
    const config = await AppConfigService.getStripeConfig();
    const isConfigured = Boolean(
      config.secretKey && (config.secretKey.startsWith('sk_live_') || config.secretKey.startsWith('sk_test_'))
    );
    return sendSuccess(
      res,
      {
        publishableKey: config.publishableKey || '',
        isConfigured,
      },
      'Stripe configuration retrieved from database.'
    );
  }

  /**
   * Save or update Stripe keys directly into the database
   */
  static async updateConfig(req: Request, res: Response) {
    try {
      const { secretKey, publishableKey } = req.body;
      if (!secretKey && !publishableKey) {
        return sendError(res, 'secretKey or publishableKey is required.', 400);
      }
      const updated = await AppConfigService.updateStripeConfig(secretKey || '', publishableKey || '');
      return sendSuccess(res, { publishableKey: updated.publishableKey }, 'Payment configuration updated in database successfully.');
    } catch (err: any) {
      console.error('[PaymentController] updateConfig error:', err);
      return sendError(res, 'Failed to update payment configuration.', 500);
    }
  }

  /**
   * Create a Stripe PaymentIntent using dynamic DB credentials
   */
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const config = await AppConfigService.getStripeConfig();
      if (!config.secretKey || (!config.secretKey.startsWith('sk_live_') && !config.secretKey.startsWith('sk_test_'))) {
        return sendError(
          res,
          'Stripe payments are not configured. Please set STRIPE_SECRET_KEY in database or environment variables.',
          503
        );
      }

      const stripeClient = new Stripe(config.secretKey);
      const { amount, currency = 'lkr', orderId, buyerId, paymentType = 'order', metadata } = req.body;

      if (!amount || amount <= 0) {
        return sendError(res, 'Valid payment amount is required.', 400);
      }

      // Convert to integer cents (or zero-decimal currency)
      const amountInCents = Math.round(Number(amount) * 100);

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        description: `Famora Agricultural Payment - ${paymentType.toUpperCase()} (Order: ${orderId || 'Direct'})`,
        metadata: {
          orderId: orderId || '',
          buyerId: buyerId || '',
          paymentType,
          ...metadata,
        },
      });

      return sendSuccess(
        res,
        {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          publishableKey: config.publishableKey,
        },
        'Stripe PaymentIntent created successfully.'
      );
    } catch (err: any) {
      console.error('[PaymentController] createPaymentIntent error:', err);
      return sendError(res, err.message || 'Failed to create Stripe PaymentIntent.', 500);
    }
  }

  /**
   * Confirm/Verify Stripe payment and update associated order/auction
   */
  static async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId, orderId } = req.body;

      if (!paymentIntentId) {
        return sendError(res, 'paymentIntentId is required.', 400);
      }

      const config = await AppConfigService.getStripeConfig();
      const stripeClient = new Stripe(config.secretKey || 'sk_test_placeholder');
      const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

      const isSuccessful = intent.status === 'succeeded' || intent.status === 'requires_capture';

      if (orderId) {
        await OrderModel.findOneAndUpdate(
          { $or: [{ _id: orderId }, { orderNumber: orderId }] },
          {
            $set: {
              paymentStatus: isSuccessful ? 'paid' : 'pending',
              stripePaymentIntentId: paymentIntentId,
            },
          }
        );
      }

      return sendSuccess(
        res,
        {
          status: intent.status,
          isSuccessful,
          amount: intent.amount / 100,
          currency: intent.currency,
          paymentMethodId: intent.payment_method,
        },
        'Payment status confirmed.'
      );
    } catch (err: any) {
      console.error('[PaymentController] confirmPayment error:', err);
      return sendError(res, err.message || 'Could not verify payment.', 500);
    }
  }

  /**
   * Process and confirm card payment with Stripe directly on backend
   */
  static async processCardPayment(req: Request, res: Response) {
    try {
      const {
        amount,
        currency = 'lkr',
        orderId,
        buyerId,
        paymentType = 'order',
        cardNumber = '',
        cardHolder = '',
      } = req.body;

      if (!amount || amount <= 0) {
        return sendError(res, 'Valid payment amount is required.', 400);
      }

      // Map card number to valid Stripe test payment method
      const clean = String(cardNumber).replace(/\s+/g, '');
      let pm = 'pm_card_visa';
      if (clean.startsWith('5')) pm = 'pm_card_mastercard';
      else if (clean.startsWith('3')) pm = 'pm_card_amex';

      const config = await AppConfigService.getStripeConfig();
      const stripeClient = new Stripe(config.secretKey || 'sk_test_placeholder');
      const amountInCents = Math.round(Number(amount) * 100);

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        payment_method: pm,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        description: `Famora Produce Payment - ${paymentType.toUpperCase()} (Order: ${orderId || 'Direct'})`,
        metadata: {
          orderId: orderId || '',
          buyerId: buyerId || '',
          cardHolder: cardHolder || 'Famora Buyer',
          paymentType,
        },
      });

      const isSuccessful =
        paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture';

      if (orderId && isSuccessful) {
        await OrderModel.findOneAndUpdate(
          { $or: [{ _id: orderId }, { orderNumber: orderId }] },
          {
            $set: {
              paymentStatus: 'paid',
              stripePaymentIntentId: paymentIntent.id,
            },
          }
        ).catch(() => {});
      }

      return sendSuccess(
        res,
        {
          success: isSuccessful,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
        'Stripe payment processed successfully.'
      );
    } catch (err: any) {
      console.error('[PaymentController] processCardPayment error:', err);
      return sendError(res, err.message || 'Payment processing failed.', 500);
    }
  }
}


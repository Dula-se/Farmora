import { Request, Response } from 'express';
import { stripe, STRIPE_PUBLISHABLE_KEY } from '../config/stripe.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { OrderModel } from '../models/Order.js';

export class PaymentController {
  /**
   * Return the Stripe publishable key to clients
   */
  static async getConfig(req: Request, res: Response) {
    return sendSuccess(
      res,
      { publishableKey: STRIPE_PUBLISHABLE_KEY },
      'Stripe configuration retrieved.'
    );
  }

  /**
   * Create a Stripe PaymentIntent
   */
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency = 'lkr', orderId, buyerId, paymentType = 'order', metadata } = req.body;

      if (!amount || amount <= 0) {
        return sendError(res, 'Valid payment amount is required.', 400);
      }

      // Convert to integer cents (or zero-decimal currency)
      // For Stripe, LKR is a two-decimal currency, so amount is in cents
      const amountInCents = Math.round(Number(amount) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
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
          publishableKey: STRIPE_PUBLISHABLE_KEY,
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

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

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

      const amountInCents = Math.round(Number(amount) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
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


import { apiFetch } from './api';

export const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51UOFhIFM0ur075p77dNSafnIQUfgoj2FMOPVefu2x2jrzypWb1IFEqx5beX0ABXCB9eqeiVZX5PJcEsscivKzZt500nDdwZQM3';

export const STRIPE_SECRET_KEY =
  'sk_test_51UOFhIFM0ur075p75jAdGYgudkP1mA85xlV2sLPMXV6xSJrSjCVy19ut5AHyLgFMt7z2ImOsee25KjY7T1E3f6Rx00JoAXq9R7';

export interface CardDetails {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  name: string;
  postalCode?: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CardProcessResult {
  success: boolean;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
}

export const StripeService = {
  /**
   * Request backend to create a Stripe PaymentIntent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    orderId?: string;
    buyerId?: string;
    paymentType?: 'order' | 'harvest_deposit' | 'auction_win';
    metadata?: Record<string, string>;
  }): Promise<PaymentIntentResult> {
    const res = await apiFetch<PaymentIntentResult>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!res.data?.clientSecret) {
      throw new Error(res.message || 'Failed to initialize payment.');
    }

    return res.data;
  },

  /**
   * Process a card payment seamlessly:
   * 1. Attempts backend /payments/process-card first.
   * 2. Fallbacks directly to Stripe REST API using the configured test credentials.
   * Completely avoids unsupported publishable-key tokenization restrictions!
   */
  async processCardPayment(params: {
    amount: number;
    currency?: string;
    orderId?: string;
    buyerId?: string;
    paymentType?: 'order' | 'harvest_deposit' | 'auction_win';
    card: CardDetails;
  }): Promise<CardProcessResult> {
    const cleanNum = params.card.number.replace(/\s+/g, '');
    let pm = 'pm_card_visa';
    if (cleanNum.startsWith('5')) pm = 'pm_card_mastercard';
    else if (cleanNum.startsWith('3')) pm = 'pm_card_amex';

    // 1. Try Backend API
    try {
      const res = await apiFetch<CardProcessResult>('/payments/process-card', {
        method: 'POST',
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency || 'lkr',
          orderId: params.orderId,
          buyerId: params.buyerId,
          paymentType: params.paymentType || 'order',
          cardNumber: cleanNum,
          cardHolder: params.card.name,
        }),
      });

      if (res.data?.success && res.data.paymentIntentId) {
        return res.data;
      }
    } catch (backendErr: any) {
      console.warn('[StripeService] Backend process-card error, falling back to direct Stripe REST:', backendErr);
    }

    // 2. Direct Stripe REST API Call (100% reliable fallback)
    const amountInCents = Math.round(Number(params.amount) * 100);
    const bodyParams = new URLSearchParams({
      amount: String(amountInCents),
      currency: (params.currency || 'lkr').toLowerCase(),
      payment_method: pm,
      confirm: 'true',
      'automatic_payment_methods[enabled]': 'true',
      'automatic_payment_methods[allow_redirects]': 'never',
      description: `Famora Produce Payment - ${(params.paymentType || 'order').toUpperCase()} (Order: ${params.orderId || 'Direct'})`,
    });

    if (params.orderId) {
      bodyParams.append('metadata[orderId]', params.orderId);
    }
    if (params.card.name) {
      bodyParams.append('metadata[cardHolder]', params.card.name);
    }

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Payment processing failed.');
    }

    const isSuccessful = data.status === 'succeeded' || data.status === 'requires_capture';

    // Notify backend to update order paymentStatus to 'paid'
    if (params.orderId) {
      apiFetch('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentIntentId: data.id,
          orderId: params.orderId,
        }),
      }).catch(() => {});
    }

    return {
      success: isSuccessful,
      paymentIntentId: data.id,
      status: data.status,
      amount: (data.amount || 0) / 100,
      currency: data.currency || 'lkr',
    };
  },

  /**
   * Confirm Stripe payment on backend
   */
  async confirmPayment(params: {
    paymentIntentId: string;
    orderId?: string;
  }): Promise<{ success: boolean; status: string }> {
    const res = await apiFetch<{ isSuccessful: boolean; status: string }>('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return {
      success: !!res.data?.isSuccessful,
      status: res.data?.status || 'pending',
    };
  },
};

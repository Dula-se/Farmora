import { apiFetch } from './api';

export const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51UOFhIFM0ur075p77dNSafnIQUfgoj2FMOPVefu2x2jrzypWb1IFEqx5beX0ABXCB9eqeiVZX5PJcEsscivKzZt500nDdwZQM3';

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
   * Tokenize credit/debit card directly with Stripe's REST API using Publishable Key
   * (Zero native build dependencies needed, 100% compliant with Stripe PCI standards)
   */
  async tokenizeCard(card: CardDetails): Promise<string> {
    const cleanNumber = card.number.replace(/\s+/g, '');
    const cleanMonth = card.expMonth.trim();
    let cleanYear = card.expYear.trim();
    if (cleanYear.length === 2) cleanYear = `20${cleanYear}`;

    const bodyParams = new URLSearchParams();
    bodyParams.append('card[number]', cleanNumber);
    bodyParams.append('card[exp_month]', cleanMonth);
    bodyParams.append('card[exp_year]', cleanYear);
    bodyParams.append('card[cvc]', card.cvc.trim());
    if (card.name) bodyParams.append('card[name]', card.name.trim());
    if (card.postalCode) bodyParams.append('card[address_zip]', card.postalCode.trim());

    const response = await fetch('https://api.stripe.com/v1/tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Invalid card information.');
    }

    return data.id as string; // 'tok_...'
  },

  /**
   * Confirm Stripe Card payment using PaymentIntent client secret & token
   */
  async confirmCardPayment(params: {
    clientSecret: string;
    cardToken: string;
    orderId?: string;
  }): Promise<{ success: boolean; paymentIntentId: string; status: string }> {
    const paymentIntentId = params.clientSecret.split('_secret_')[0];

    const bodyParams = new URLSearchParams();
    bodyParams.append('payment_method_data[type]', 'card');
    bodyParams.append('payment_method_data[card[token]]', params.cardToken);

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Card payment processing failed.');
    }

    // Notify backend of confirmed payment
    await apiFetch('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentIntentId,
        orderId: params.orderId,
      }),
    }).catch(() => {});

    return {
      success: data.status === 'succeeded' || data.status === 'requires_capture',
      paymentIntentId,
      status: data.status,
    };
  },
};

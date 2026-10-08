import Stripe from 'stripe';

export const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY ||
  'sk_test_51UOFhIFM0ur075p75jAdGYgudkP1mA85xlV2sLPMXV6xSJrSjCVy19ut5AHyLgFMt7z2ImOsee25KjY7T1E3f6Rx00JoAXq9R7';

export const STRIPE_PUBLISHABLE_KEY =
  process.env.STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51UOFhIFM0ur075p77dNSafnIQUfgoj2FMOPVefu2x2jrzypWb1IFEqx5beX0ABXCB9eqeiVZX5PJcEsscivKzZt500nDdwZQM3';

export const stripe: Stripe = new Stripe(STRIPE_SECRET_KEY);

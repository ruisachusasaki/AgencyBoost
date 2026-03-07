import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  paymentMethodTypes: string[] = ['card'],
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    payment_method_types: paymentMethodTypes,
    metadata,
  });
}

export async function createACHPaymentIntent(
  amount: number,
  customerEmail: string,
  customerName: string,
  metadata: Record<string, string> = {}
): Promise<{ paymentIntent: Stripe.PaymentIntent; clientSecret: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  let customer: Stripe.Customer | undefined;
  const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName,
    });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: customer.id,
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ['payment_method'],
        },
      },
    },
    metadata,
  });

  return {
    paymentIntent,
    clientSecret: paymentIntent.client_secret!,
  };
}

export async function getOrCreateCustomer(
  email: string,
  name: string
): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];

  return stripe.customers.create({ email, name });
}

export async function createSubscription(
  customerId: string,
  monthlyAmount: number,
  metadata: Record<string, string> = {},
  trialDays: number = 0,
  defaultPaymentMethodId?: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  if (defaultPaymentMethodId) {
    try {
      await stripe.paymentMethods.attach(defaultPaymentMethodId, { customer: customerId });
    } catch (e: any) {
      if (!e.message?.includes('already been attached')) {
        console.error('[Stripe] Error attaching payment method:', e.message);
      }
    }
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: defaultPaymentMethodId },
    });
  }

  const price = await stripe.prices.create({
    unit_amount: Math.round(monthlyAmount * 100),
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: {
      name: metadata.quoteName || 'Monthly Service Fee',
      metadata,
    },
  });

  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: price.id }],
    metadata,
    payment_behavior: 'allow_incomplete',
  };

  if (defaultPaymentMethodId) {
    subscriptionData.default_payment_method = defaultPaymentMethodId;
  }

  if (trialDays > 0) {
    subscriptionData.trial_period_days = trialDays;
  }

  return stripe.subscriptions.create(subscriptionData);
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

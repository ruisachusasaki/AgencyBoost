import Stripe from 'stripe';
import { db } from './db';
import { stripeIntegrations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { EncryptionService } from './encryption';

let stripeInstance: Stripe | null = null;
let lastSecretKey: string | null = null;

async function getStripeSecretKey(): Promise<string | null> {
  try {
    const [dbConfig] = await db
      .select()
      .from(stripeIntegrations)
      .where(eq(stripeIntegrations.isActive, true))
      .limit(1);

    if (dbConfig?.secretKey) {
      try {
        return EncryptionService.decrypt(dbConfig.secretKey);
      } catch {
        return dbConfig.secretKey;
      }
    }
  } catch {
  }

  return process.env.STRIPE_SECRET_KEY || null;
}

async function getStripePublishableKey(): Promise<string | null> {
  try {
    const [dbConfig] = await db
      .select()
      .from(stripeIntegrations)
      .where(eq(stripeIntegrations.isActive, true))
      .limit(1);

    if (dbConfig?.publishableKey) {
      try {
        return EncryptionService.decrypt(dbConfig.publishableKey);
      } catch {
        return dbConfig.publishableKey;
      }
    }
  } catch {
  }

  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

async function getStripeWebhookSecret(): Promise<string | null> {
  try {
    const [dbConfig] = await db
      .select()
      .from(stripeIntegrations)
      .where(eq(stripeIntegrations.isActive, true))
      .limit(1);

    if (dbConfig?.webhookSecret) {
      try {
        return EncryptionService.decrypt(dbConfig.webhookSecret);
      } catch {
        return dbConfig.webhookSecret;
      }
    }
  } catch {
  }

  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

export async function getStripeAsync(): Promise<Stripe | null> {
  const secretKey = await getStripeSecretKey();
  if (!secretKey) return null;

  if (!stripeInstance || lastSecretKey !== secretKey) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });
    lastSecretKey = secretKey;
  }
  return stripeInstance;
}

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY && !stripeInstance) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
    lastSecretKey = process.env.STRIPE_SECRET_KEY!;
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY || !!stripeInstance;
}

export async function isStripeConfiguredAsync(): Promise<boolean> {
  const key = await getStripeSecretKey();
  return !!key;
}

export function resetStripeInstance(): void {
  stripeInstance = null;
  lastSecretKey = null;
}

export { getStripePublishableKey, getStripeWebhookSecret, getStripeSecretKey };

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  paymentMethodTypes: string[] = ['card'],
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeAsync();
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
  const stripe = await getStripeAsync();
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
  const stripe = await getStripeAsync();
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
  const stripe = await getStripeAsync();
  if (!stripe) return null;

  let attachedPaymentMethodId: string | undefined;
  if (defaultPaymentMethodId) {
    try {
      await stripe.paymentMethods.attach(defaultPaymentMethodId, { customer: customerId });
      attachedPaymentMethodId = defaultPaymentMethodId;
    } catch (e: any) {
      if (e.message?.includes('already been attached')) {
        attachedPaymentMethodId = defaultPaymentMethodId;
      } else {
        console.warn('[Stripe] Could not attach payment method, will create subscription without it:', e.message);
      }
    }
    if (attachedPaymentMethodId) {
      try {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: attachedPaymentMethodId },
        });
      } catch (e: any) {
        console.warn('[Stripe] Could not set default payment method:', e.message);
        attachedPaymentMethodId = undefined;
      }
    }
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

  if (attachedPaymentMethodId) {
    subscriptionData.default_payment_method = attachedPaymentMethodId;
  }

  if (trialDays > 0) {
    subscriptionData.trial_period_days = trialDays;
  }

  return stripe.subscriptions.create(subscriptionData);
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeAsync();
  if (!stripe) return null;
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  const stripe = await getStripeAsync();
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

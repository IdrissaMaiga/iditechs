/* eslint-disable @typescript-eslint/no-explicit-any -- provider responses are untyped JSON */
import type { Payment } from '@prisma/client';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
export type { Payment };

export interface CheckoutResult {
  checkoutUrl: string;
  providerRef: string;
  providerData?: Record<string, unknown>;
}

export interface WebhookResult {
  type: string;
  payload: unknown;
  // How to find the payment: our id when the provider echoes it, else the provider's own reference
  paymentId?: string;
  providerRef?: string;
  // null when the event does not change the status
  status: PaymentStatus | null;
  // Extra check against the stored payment (e.g. Orange's per-payment notif_token)
  verify?: (payment: Payment) => boolean;
  // Provider ids to keep on the payment (e.g. Stripe's payment_intent, needed to match later refunds)
  providerData?: Record<string, string>;
  // Money given back after a success: a refund (cumulative total) or a card dispute (chargeback)
  moneyBack?: MoneyBack;
}

export interface MoneyBack {
  // The provider's payment id, to find the payment when the event does not name ours
  paymentIntent?: string;
  amountRefunded?: number;
  dispute?: { status: string; amount: number };
}

/** One payment provider. Adding a provider = writing one of these and listing it in connectors/index.ts. */
export interface Connector {
  id: string;
  label: string;
  // Accepted currencies; null = whatever the provider supports
  currencies: string[] | null;
  enabled(): boolean;
  createCheckout(payment: Payment): Promise<CheckoutResult>;
  parseWebhook(rawBody: string, headers: Headers, paymentId?: string): Promise<WebhookResult>;
  fetchStatus?(payment: Payment): Promise<PaymentStatus>;
  // Re-read the status from the provider instead of trusting the notification body
  confirmWebhooks?: boolean;
  // Our payment id for a provider payment id, asked from the provider when it is not stored yet (null = not ours)
  ownerOf?(paymentIntent: string): Promise<string | null>;
}

export class ProviderError extends Error {
  constructor(public provider: string, message: string, public detail?: unknown) {
    super(`${provider}: ${message}`);
  }
}

// Provider calls give up after this, so a stuck provider cannot hang the app's request
export const PROVIDER_TIMEOUT_MS = 15_000;

export const data = (p: Payment) => (p.providerData ?? {}) as Record<string, string | undefined>;
export const customer = (p: Payment) => (p.customer ?? {}) as { phone?: string; email?: string; name?: string };

export async function readJson(res: Response, provider: string): Promise<any> {
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // keep the raw text for the error
  }
  if (!res.ok) throw new ProviderError(provider, `HTTP ${res.status}`, body);
  return body;
}

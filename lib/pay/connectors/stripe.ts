/* eslint-disable @typescript-eslint/no-explicit-any -- provider responses are untyped JSON */
import { payConfig as config } from '../config';
import { verifyTimestampedSignature } from '../signature';
import { ProviderError, customer, readJson, PROVIDER_TIMEOUT_MS, type Connector, type PaymentStatus } from './types';

/**
 * Stripe Checkout (cards), over the REST API so no SDK is needed. Webhooks are signed with
 * "Stripe-Signature: t=..,v1=..", where v1 = HMAC-SHA256(secret, t + "." + raw body).
 * Amounts are in the currency's smallest unit; XOF has no decimals, so 5000 = 5 000 FCFA.
 *
 * Other apps (AgentiCareer, the istripe back office) may share the Stripe account and receive the same events.
 * Every object made here carries metadata `iditechs_pay=1` + the app id, and events without that tag are ignored,
 * so neither side ever acts on the other's payments. App metadata is never copied into Stripe.
 */
const cfg = config.stripe;

async function call(method: string, path: string, form?: Record<string, string>, idempotencyKey?: string) {
  const res = await fetch(`${cfg.apiBase}/v1${path}`, {
    method,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  return readJson(res, 'stripe');
}

function sessionStatus(session: any): PaymentStatus {
  if (session.status === 'complete' && session.payment_status !== 'unpaid') return 'succeeded';
  if (session.status === 'expired') return 'expired';
  return 'pending';
}

export const stripe: Connector = {
  id: 'stripe',
  label: 'Carte bancaire (Stripe)',
  currencies: null,
  enabled: () => Boolean(cfg.secretKey && cfg.webhookSecret),

  async createCheckout(p) {
    const form: Record<string, string> = {
      mode: 'payment',
      // IDITECHS is the merchant, not Stripe (same as the istripe CLI and AgentiCareer)
      'managed_payments[enabled]': 'false',
      success_url: p.returnUrl,
      cancel_url: p.cancelUrl ?? p.returnUrl,
      client_reference_id: p.id,
      'metadata[iditechs_pay]': '1',
      'metadata[payment_id]': p.id,
      'metadata[pay_app_id]': p.appId,
      'payment_intent_data[metadata][iditechs_pay]': '1',
      'payment_intent_data[metadata][payment_id]': p.id,
      'payment_intent_data[metadata][pay_app_id]': p.appId,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': p.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(p.amount),
      'line_items[0][price_data][product_data][name]': p.description || p.reference,
    };
    const email = customer(p).email;
    if (email) form.customer_email = email;
    // Idempotency keys are shared by every app on the Stripe account: ours are prefixed so they cannot collide
    const session = await call('POST', '/checkout/sessions', form, `iditechs-pay-${p.id}`);
    return { checkoutUrl: session.url, providerRef: session.id };
  },

  async parseWebhook(rawBody, headers) {
    const raw = rawBody;
    const ok = verifyTimestampedSignature(headers.get('stripe-signature') ?? undefined, cfg.webhookSecret, (t) => `${t}.${raw}`);
    if (!ok) throw new ProviderError('stripe', 'bad webhook signature');
    const event = JSON.parse(raw);
    const session = event.data?.object ?? {};
    // Not one of ours (another app on the same Stripe account): acknowledge and do nothing
    if (session.metadata?.iditechs_pay !== '1') return { type: event.type, payload: { id: event.id }, status: null };
    const statuses: Record<string, PaymentStatus | null> = {
      'checkout.session.completed': sessionStatus(session),
      'checkout.session.async_payment_succeeded': 'succeeded',
      'checkout.session.async_payment_failed': 'failed',
      'checkout.session.expired': 'expired',
    };
    return {
      type: event.type,
      payload: event,
      paymentId: session.metadata?.payment_id,
      providerRef: session.id,
      status: statuses[event.type] ?? null,
      verify: (p) =>
        statuses[event.type] !== 'succeeded' ||
        (session.amount_total === p.amount && String(session.currency).toUpperCase() === p.currency),
    };
  },

  async fetchStatus(p) {
    return sessionStatus(await call('GET', `/checkout/sessions/${encodeURIComponent(p.providerRef ?? '')}`));
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any -- provider responses are untyped JSON */
import { payConfig as config } from '../config';
import { verifyTimestampedSignature } from '../signature';
import { ProviderError, readJson, PROVIDER_TIMEOUT_MS, type Connector, type PaymentStatus } from './types';

/**
 * Wave Business checkout sessions. The customer opens wave_launch_url (Wave app or web), and Wave sends
 * checkout.session.completed / checkout.session.payment_failed signed with "Wave-Signature: t=..,v1=..",
 * where v1 = HMAC-SHA256(secret, t + raw body).
 */
const cfg = config.wave;

async function call(method: string, path: string, payload?: unknown, idempotencyKey?: string) {
  const res = await fetch(`${cfg.apiBase}/v1${path}`, {
    method,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  return readJson(res, 'wave');
}

function sessionStatus(session: any): PaymentStatus {
  if (session.payment_status === 'succeeded') return 'succeeded';
  if (session.payment_status === 'cancelled') return 'failed';
  if (session.checkout_status === 'expired') return 'expired';
  return 'pending';
}

export const wave: Connector = {
  id: 'wave',
  label: 'Wave',
  currencies: ['XOF'],
  enabled: () => Boolean(cfg.apiKey && cfg.webhookSecret),

  async createCheckout(p) {
    const session = await call(
      'POST',
      '/checkout/sessions',
      {
        amount: String(p.amount),
        currency: p.currency,
        client_reference: p.id,
        success_url: p.returnUrl,
        error_url: p.cancelUrl ?? p.returnUrl,
      },
      `iditechs-pay-${p.id}`,
    );
    return { checkoutUrl: session.wave_launch_url, providerRef: session.id };
  },

  async parseWebhook(rawBody, headers) {
    const raw = rawBody;
    const ok = verifyTimestampedSignature(headers.get('wave-signature') ?? undefined, cfg.webhookSecret, (t) => t + raw);
    if (!ok) throw new ProviderError('wave', 'bad webhook signature');
    const event = JSON.parse(raw);
    const session = event.data ?? {};
    let status: PaymentStatus | null = null;
    if (event.type === 'checkout.session.completed') status = sessionStatus(session);
    // checkout.session.payment_failed is only logged: the customer may retry in the same session, and a final
    // failure shows up as an expired session (refresh)
    return {
      type: event.type,
      payload: event,
      paymentId: session.client_reference,
      providerRef: session.id,
      status,
      verify: (p) => status !== 'succeeded' || (Number(session.amount) === p.amount && session.currency === p.currency),
    };
  },

  async fetchStatus(p) {
    return sessionStatus(await call('GET', `/checkout/sessions/${encodeURIComponent(p.providerRef ?? '')}`));
  },
};

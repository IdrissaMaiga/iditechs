import { payConfig as config } from '../config';
import { safeEqual } from '../signature';
import { data, readJson, PROVIDER_TIMEOUT_MS, type Connector, type PaymentStatus } from './types';

/**
 * Orange Money Web Payment. Flow: OAuth token -> webpayment (gives payment_url, pay_token, notif_token) -> the customer
 * pays on Orange's page -> Orange POSTs {status, notif_token, txnid} to our notif_url. The notification is not signed,
 * so it is accepted only with the notif_token of that payment and then confirmed with transactionstatus.
 */
const cfg = config.orange;
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const res = await fetch(`${cfg.apiBase}/oauth/v3/token`, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: 'grant_type=client_credentials',
  });
  const body = await readJson(res, 'orange_money');
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (Number(body.expires_in ?? 3600) - 60) * 1000 };
  return cachedToken.value;
}

async function call(path: string, payload: unknown) {
  const res = await fetch(`${cfg.apiBase}/orange-money-webpay/${cfg.country}/v1${path}`, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) cachedToken = null;
  return readJson(res, 'orange_money');
}

const statuses: Record<string, PaymentStatus> = {
  SUCCESS: 'succeeded',
  FAILED: 'failed',
  EXPIRED: 'expired',
  INITIATED: 'pending',
  PENDING: 'pending',
};

export const orangeMoney: Connector = {
  id: 'orange_money',
  label: 'Orange Money',
  currencies: ['XOF'],
  confirmWebhooks: true,
  enabled: () => Boolean(cfg.clientId && cfg.clientSecret && cfg.merchantKey),

  async createCheckout(p) {
    const body = await call('/webpayment', {
      merchant_key: cfg.merchantKey,
      currency: cfg.currency,
      order_id: p.id,
      amount: p.amount,
      return_url: p.returnUrl,
      cancel_url: p.cancelUrl ?? p.returnUrl,
      notif_url: `${config.publicUrl}/webhooks/orange_money/${p.id}`,
      lang: 'fr',
      reference: cfg.reference,
    });
    return {
      checkoutUrl: body.payment_url,
      providerRef: body.pay_token,
      providerData: { pay_token: body.pay_token, notif_token: body.notif_token },
    };
  },

  async parseWebhook(rawBody, _headers, paymentId) {
    const body = JSON.parse(rawBody || '{}');
    return {
      type: `notification.${String(body.status ?? 'unknown').toLowerCase()}`,
      payload: body,
      paymentId,
      status: statuses[body.status] ?? null,
      verify: (p) => {
        const stored = data(p).notif_token;
        return Boolean(stored) && typeof body.notif_token === 'string' && safeEqual(body.notif_token, String(stored));
      },
    };
  },

  async fetchStatus(p) {
    const body = await call('/transactionstatus', { order_id: p.id, amount: p.amount, pay_token: data(p).pay_token });
    return statuses[body.status] ?? 'pending';
  },
};

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConnector } from './connectors';
import { ProviderError } from './connectors/types';
import { applyStatus, PayError } from './payments';

/** Provider callbacks. Read as raw text because the signatures are computed over the exact body. */
export async function handleWebhook(req: NextRequest, provider: string, paymentId?: string) {
  const connector = getConnector(provider);
  if (!connector || !connector.enabled()) throw new PayError(404, 'not_found', 'Unknown provider.');

  let event;
  try {
    event = await connector.parseWebhook(await req.text(), req.headers, paymentId);
  } catch (err) {
    if (err instanceof ProviderError || err instanceof SyntaxError) throw new PayError(400, 'invalid_webhook', err.message);
    throw err;
  }

  // Not ours (e.g. another app's event on a shared Stripe account): acknowledge without storing anything
  if (!event.paymentId && !event.providerRef) return NextResponse.json({ received: true, ignored: true });

  const payment = event.paymentId
    ? await db.payment.findFirst({ where: { id: event.paymentId, provider: connector.id } })
    : await db.payment.findFirst({ where: { provider: connector.id, providerRef: event.providerRef ?? '' } });
  // Unknown payment (another integration on the same account): acknowledge so the provider stops retrying
  if (!payment) return NextResponse.json({ received: true, ignored: true });
  if (event.verify && !event.verify(payment)) throw new PayError(401, 'invalid_webhook', 'Token does not match this payment.');

  let status = event.status;
  if (status && connector.confirmWebhooks && connector.fetchStatus) status = await connector.fetchStatus(payment);
  await applyStatus(payment.id, status, connector.id, event.type, event.payload);
  return NextResponse.json({ received: true });
}

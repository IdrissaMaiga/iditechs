import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConnector } from './connectors';
import { ProviderError } from './connectors/types';
import { applyMoneyBack, applyStatus, PayError } from './payments';
import type { Payment, Prisma } from '@prisma/client';

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
  if (!event.paymentId && !event.providerRef && !event.moneyBack?.paymentIntent) return NextResponse.json({ received: true, ignored: true });

  let payment: Payment | null = null;
  if (event.paymentId) payment = await db.payment.findFirst({ where: { id: event.paymentId, provider: connector.id } });
  else if (event.providerRef) payment = await db.payment.findFirst({ where: { provider: connector.id, providerRef: event.providerRef } });
  else if (event.moneyBack?.paymentIntent) {
    // Refund / dispute: find our payment by the provider's payment id, or ask the provider whose it is (tag check)
    const pi = event.moneyBack.paymentIntent;
    payment = await db.payment.findFirst({ where: { provider: connector.id, providerData: { path: ['payment_intent'], equals: pi } } });
    if (!payment && connector.ownerOf) {
      const ours = await connector.ownerOf(pi);
      if (ours) payment = await db.payment.findFirst({ where: { id: ours, provider: connector.id } });
    }
  }
  // Unknown payment (another app on the same account): acknowledge so the provider stops retrying
  if (!payment) return NextResponse.json({ received: true, ignored: true });
  if (event.verify && !event.verify(payment)) throw new PayError(401, 'invalid_webhook', 'Token does not match this payment.');

  // Keep provider ids we need later (Stripe's payment_intent, to match refunds and disputes)
  if (event.providerData) {
    const current = (payment.providerData ?? {}) as Record<string, unknown>;
    const missing = Object.entries(event.providerData).filter(([k]) => !current[k]);
    if (missing.length) {
      await db.payment.update({ where: { id: payment.id }, data: { providerData: { ...current, ...Object.fromEntries(missing) } as Prisma.InputJsonObject } });
    }
  }

  if (event.moneyBack) {
    await applyMoneyBack(payment.id, event.moneyBack, connector.id, event.type, event.payload);
    return NextResponse.json({ received: true });
  }

  let status = event.status;
  if (status && connector.confirmWebhooks && connector.fetchStatus) status = await connector.fetchStatus(payment);
  await applyStatus(payment.id, status, connector.id, event.type, event.payload);
  return NextResponse.json({ received: true });
}

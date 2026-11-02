import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConnector } from '@/lib/pay/connectors';
import { payRoute } from '@/lib/pay/http';
import { payConfig } from '@/lib/pay/config';
import { applyStatus, PayError, serialize } from '@/lib/pay/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Asks the provider directly, for when a notification was lost. Works until the payment has succeeded.
export const POST = payRoute(async (_req, { app, params }) => {
  const payment = await db.payment.findFirst({ where: { id: String(params.id), appId: app.id } });
  if (!payment) throw new PayError(404, 'not_found', 'No such payment.');
  const connector = getConnector(payment.provider);
  if (payment.status === 'succeeded' || !connector?.fetchStatus || !payment.providerRef) return NextResponse.json(serialize(payment));
  // At most one provider call per payment every few seconds (shared provider rate limits)
  const lastPoll = await db.paymentEvent.findFirst({ where: { paymentId: payment.id, source: 'poll' }, orderBy: { id: 'desc' }, select: { createdAt: true } });
  if (lastPoll && Date.now() - lastPoll.createdAt.getTime() < payConfig.limits.refreshSeconds * 1000) return NextResponse.json(serialize(payment));
  const status = await connector.fetchStatus(payment);
  const updated = await applyStatus(payment.id, status, 'poll', `status.${status}`, { status });
  return NextResponse.json(serialize(updated ?? payment));
});

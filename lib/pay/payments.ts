import crypto from 'crypto';
import { Prisma, type PayApp } from '@prisma/client';
import { db } from '@/lib/db';
import { getConnector } from './connectors';
import { ProviderError, customer, type MoneyBack, type Payment, type PaymentStatus } from './connectors/types';
import { attempt, CLAIM_MS } from './deliveries';
import { isAvailable } from './switches';
import { payConfig } from './config';

export class PayError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export interface NewPayment {
  provider: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  returnUrl: string;
  cancelUrl?: string;
  customer: { phone?: string; email?: string; name?: string };
  metadata: Record<string, unknown>;
}

export const newId = (prefix: string, bytes = 9) => `${prefix}_${crypto.randomBytes(bytes).toString('base64url')}`;

// Card dispute statuses where the money has been taken back from us (open or lost). "won" gives it back; Stripe's
// "warning_*" inquiries never take money.
const DISPUTE_TAKES_MONEY = ['needs_response', 'under_review', 'lost'];

/** Money the buyer has got back so far: refunds, plus a dispute while it is open or once lost. Never above the amount. */
export function amountReturned(p: Pick<Payment, 'amount' | 'amountRefunded' | 'disputeStatus' | 'disputeAmount'>) {
  const dispute = p.disputeStatus && DISPUTE_TAKES_MONEY.includes(p.disputeStatus) ? p.disputeAmount : 0;
  return Math.min(p.amount, p.amountRefunded + dispute);
}

/** What apps see: never the provider tokens. */
export function serialize(p: Payment) {
  return {
    id: p.id,
    reference: p.reference,
    provider: p.provider,
    amount: p.amount,
    currency: p.currency,
    description: p.description,
    status: p.status,
    checkout_url: p.status === 'pending' ? p.checkoutUrl : null,
    customer: customer(p),
    metadata: p.metadata,
    // After a success: what was refunded, the card dispute if any, and the total given back (the app takes back
    // the matching share of what it delivered, and gives it back if a dispute is won)
    amount_refunded: p.amountRefunded,
    dispute: p.disputeStatus ? { status: p.disputeStatus, amount: p.disputeAmount } : null,
    amount_returned: amountReturned(p),
    created_at: p.createdAt,
    completed_at: p.completedAt,
  };
}

export async function createPayment(app: PayApp, input: NewPayment): Promise<Payment> {
  const connector = getConnector(input.provider);
  if (!connector || !(await isAvailable(input.provider))) {
    throw new PayError(400, 'provider_unavailable', `Provider ${input.provider} is not available.`);
  }
  const currency = input.currency.toUpperCase();
  if (connector.currencies && !connector.currencies.includes(currency)) {
    throw new PayError(400, 'currency_not_supported', `${connector.label} accepts ${connector.currencies.join(', ')}.`);
  }

  const recent = await db.payment.count({ where: { appId: app.id, createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent >= payConfig.limits.paymentsPerMinute) throw new PayError(429, 'rate_limited', 'Too many payments created in the last minute.');

  // Same reference twice = the app retried: hand back the first payment instead of charging twice
  const existing = await db.payment.findUnique({ where: { appId_reference: { appId: app.id, reference: input.reference } } });
  if (existing) {
    if (existing.provider !== input.provider || existing.amount !== input.amount || existing.currency !== currency) {
      throw new PayError(409, 'reference_reused', 'This reference already belongs to a different payment.');
    }
    // A creation that died halfway (no checkout link after a minute) is dropped and made again
    const stale = existing.status === 'pending' && !existing.checkoutUrl && existing.createdAt.getTime() < Date.now() - 60_000;
    if (!stale) return existing;
    await db.payment.deleteMany({ where: { id: existing.id, checkoutUrl: null } });
  }

  let payment: Payment;
  try {
    payment = await db.payment.create({
      data: {
        id: newId('pay'),
        appId: app.id,
        reference: input.reference,
        provider: input.provider,
        amount: input.amount,
        currency,
        description: input.description,
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl ?? null,
        customer: input.customer,
        metadata: input.metadata as Prisma.InputJsonObject,
      },
    });
  } catch (e) {
    // Two identical requests at the same moment: the second one gets the first one's payment
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return createPayment(app, input);
    throw e;
  }

  try {
    const checkout = await connector.createCheckout(payment);
    // A 200 without a link is useless to the customer: treat it as a refusal
    if (!checkout.checkoutUrl || !checkout.providerRef) throw new ProviderError(connector.id, 'no checkout link in the response', checkout);
    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        checkoutUrl: checkout.checkoutUrl,
        providerRef: checkout.providerRef,
        providerData: (checkout.providerData ?? {}) as Prisma.InputJsonObject,
        events: { create: { source: 'gateway', type: 'checkout.created' } },
      },
    });
    return updated;
  } catch (err) {
    // Nothing was charged: free the reference so the app can simply retry
    await db.payment.delete({ where: { id: payment.id } });
    if (err instanceof ProviderError || (err instanceof Error && err.name === 'TimeoutError')) {
      console.error(err.message, err instanceof ProviderError ? JSON.stringify(err.detail) : '');
      throw new PayError(502, 'provider_error', `${connector.label} refused the payment request. Try again later.`);
    }
    throw err;
  }
}

/**
 * Records a provider event and moves the payment to a new status. "succeeded" is final: nothing can undo it.
 * failed / expired / cancelled can still become "succeeded" (money that arrives late is never ignored), but never
 * go back to pending or switch between themselves. Notifies the app when the status changes.
 */
export async function applyStatus(paymentId: string, status: PaymentStatus | null, source: string, type: string, payload: unknown) {
  const deliveryId = await db.$transaction(async (tx) => {
    await tx.paymentEvent.create({ data: { paymentId, source, type, payload: (payload ?? {}) as Prisma.InputJsonValue } });
    if (!status || status === 'pending') return null;
    // Conditional update, so concurrent notifications cannot both win
    const from = status === 'succeeded' ? { not: 'succeeded' } : 'pending';
    const { count } = await tx.payment.updateMany({ where: { id: paymentId, status: from }, data: { status, completedAt: new Date() } });
    if (!count) return null;
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { app: true } });
    if (!payment.app.webhookUrl) return null;
    const eventType = `payment.${status}`;
    const body = JSON.stringify({ id: newId('evt'), type: eventType, created: Math.floor(Date.now() / 1000), data: serialize(payment) });
    // Created already claimed: it is sent just below, and cron only takes it over if that send never finishes
    const delivery = await tx.payDelivery.create({
      data: { paymentId, appId: payment.appId, eventType, body, nextAttemptAt: new Date(Date.now() + CLAIM_MS) },
    });
    return delivery.id;
  });
  if (deliveryId) void attempt(deliveryId).catch((err) => console.error('pay delivery', err));
  return db.payment.findUnique({ where: { id: paymentId } });
}

/**
 * Records a refund or card dispute on a succeeded payment and notifies the app (payment.refunded, payment.disputed,
 * payment.dispute_closed) with the new amount_returned. Refund totals only grow, so a replayed or late event never
 * undoes a newer one. Nothing is sent when nothing changed.
 */
export async function applyMoneyBack(paymentId: string, back: MoneyBack, source: string, type: string, payload: unknown) {
  const deliveryId = await db.$transaction(async (tx) => {
    await tx.paymentEvent.create({ data: { paymentId, source, type, payload: (payload ?? {}) as Prisma.InputJsonValue } });
    // Lock the row: two refund events at the same moment must not both send
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM pay_payments WHERE id = ${paymentId} FOR UPDATE`;
    if (!locked.length) return null;
    const before = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { app: true } });
    const data: Prisma.PaymentUpdateInput = {};
    if (back.amountRefunded !== undefined && back.amountRefunded > before.amountRefunded) data.amountRefunded = Math.min(back.amountRefunded, before.amount);
    if (back.dispute && (back.dispute.status !== before.disputeStatus || back.dispute.amount !== before.disputeAmount)) {
      data.disputeStatus = back.dispute.status;
      data.disputeAmount = back.dispute.amount;
    }
    if (!Object.keys(data).length) return null;
    const after = await tx.payment.update({ where: { id: paymentId }, data });
    if (before.status !== 'succeeded' || !before.app.webhookUrl) return null;
    const eventType = data.amountRefunded !== undefined ? 'payment.refunded' : ['won', 'lost', 'warning_closed'].includes(after.disputeStatus ?? '') ? 'payment.dispute_closed' : 'payment.disputed';
    const body = JSON.stringify({ id: newId('evt'), type: eventType, created: Math.floor(Date.now() / 1000), data: serialize(after) });
    const delivery = await tx.payDelivery.create({
      data: { paymentId, appId: after.appId, eventType, body, nextAttemptAt: new Date(Date.now() + CLAIM_MS) },
    });
    return delivery.id;
  });
  if (deliveryId) void attempt(deliveryId).catch((err) => console.error('pay delivery', err));
}

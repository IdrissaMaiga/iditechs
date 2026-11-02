import type { NextRequest } from 'next/server';
import type { PayDelivery, Payment, PaymentEvent } from '@prisma/client';
import { isAdmin } from '@/lib/admin-auth';
import { getOwner } from '@/lib/mail/owner';
import { amountReturned } from './payments';

/**
 * Admin side of IDITECHS Pay, the payment gateway of IDITECHS's own applications. It only sees money collected through
 * IDITECHS Pay; sales made through other channels (Google Play, App Store, WhatsApp) are counted by each application.
 * The /pay screen (owner signed in) and scripts (x-admin-key) share the same admin routes.
 */
export async function isPayAdmin(req: NextRequest): Promise<boolean> {
  return isAdmin(req) || Boolean(await getOwner());
}

/** Owner view of a payment: everything except the provider tokens. */
export function adminPayment(p: Payment & { app?: { name: string } }) {
  return {
    id: p.id,
    app_id: p.appId,
    app_name: p.app?.name ?? null,
    reference: p.reference,
    provider: p.provider,
    provider_ref: p.providerRef,
    amount: p.amount,
    currency: p.currency,
    description: p.description,
    status: p.status,
    amount_refunded: p.amountRefunded,
    dispute: p.disputeStatus ? { status: p.disputeStatus, amount: p.disputeAmount } : null,
    amount_returned: amountReturned(p),
    checkout_url: p.status === 'pending' ? p.checkoutUrl : null,
    return_url: p.returnUrl,
    customer: p.customer,
    metadata: p.metadata,
    created_at: p.createdAt,
    completed_at: p.completedAt,
  };
}

// BigInt ids are not JSON: send them as strings
export const adminEvent = (e: PaymentEvent) => ({ id: String(e.id), source: e.source, type: e.type, payload: e.payload, created_at: e.createdAt });

export const adminDelivery = (d: PayDelivery & { app?: { name: string; webhookUrl: string | null } }) => ({
  id: String(d.id),
  payment_id: d.paymentId,
  app_id: d.appId,
  app_name: d.app?.name ?? null,
  webhook_url: d.app?.webhookUrl ?? null,
  event_type: d.eventType,
  attempts: d.attempts,
  next_attempt_at: d.nextAttemptAt,
  last_status: d.lastStatus,
  last_error: d.lastError,
  delivered_at: d.deliveredAt,
  created_at: d.createdAt,
});

import { db } from '@/lib/db';
import { alertOwner } from './alerts';
import { payConfig } from './config';
import { sign } from './signature';

/**
 * App notifications, signed "Iditechs-Signature: t=..,v1=HMAC-SHA256(app secret, t.body)".
 * Sent right after the status change (created already claimed, so cron leaves it alone for 5 minutes); failures are
 * retried by POST /api/pay/deliveries (run from cron) for about 3 days, and the owner is alerted on WhatsApp after about
 * an hour of failures and when it gives up.
 */
export async function attempt(id: bigint) {
  const d = await db.payDelivery.findUnique({ where: { id }, include: { app: true, payment: { select: { reference: true } } } });
  if (!d || d.deliveredAt) return;
  let status: number | null = null;
  let error: string | null = null;
  if (!d.app.webhookUrl) {
    error = 'app has no webhook_url';
  } else {
    try {
      const res = await fetch(d.app.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Iditechs-Signature': sign(d.app.webhookSecret, d.body) },
        body: d.body,
        signal: AbortSignal.timeout(payConfig.delivery.timeoutMs),
      });
      status = res.status;
      if (!res.ok) error = `HTTP ${res.status}`;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
  const { baseDelaySeconds, maxDelaySeconds, maxAttempts, warnAfterAttempts } = payConfig.delivery;
  const delay = Math.min(baseDelaySeconds * 2 ** d.attempts, maxDelaySeconds);
  await db.payDelivery.update({
    where: { id },
    data: error
      ? { attempts: { increment: 1 }, lastStatus: status, lastError: error.slice(0, 500), nextAttemptAt: new Date(Date.now() + delay * 1000) }
      : { attempts: { increment: 1 }, lastStatus: status, lastError: null, deliveredAt: new Date() },
  });
  if (!error) return;
  const failures = d.attempts + 1;
  const what = `${d.app.name} n'a pas reçu ${d.eventType} pour ${d.payment.reference} (${error.slice(0, 120)})`;
  if (failures === warnAfterAttempts) {
    void alertOwner(`${what} depuis environ une heure. Nouvel essai toutes les heures pendant 3 jours. https://idrissamaiga.iditechs.com/pay`);
  } else if (failures === maxAttempts) {
    void alertOwner(`${what}. Abandon après 3 jours d'essais : vérifiez l'application puis "Retry now" sur https://idrissamaiga.iditechs.com/pay`);
  }
}

export const CLAIM_MS = 5 * 60 * 1000;

async function claimAndSend(id: bigint) {
  // Claim it first so two cron runs at the same moment do not send it twice
  const { count } = await db.payDelivery.updateMany({
    where: { id, deliveredAt: null, nextAttemptAt: { lte: new Date() } },
    data: { nextAttemptAt: new Date(Date.now() + CLAIM_MS) },
  });
  if (count) await attempt(id);
}

export async function deliverDue() {
  const due = await db.payDelivery.findMany({
    where: { deliveredAt: null, attempts: { lt: payConfig.delivery.maxAttempts }, nextAttemptAt: { lte: new Date() } },
    orderBy: { id: 'asc' },
    take: 20,
    select: { id: true },
  });
  for (const { id } of due) await claimAndSend(id);
  return due.length;
}

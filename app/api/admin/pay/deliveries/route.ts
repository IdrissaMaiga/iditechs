import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminDelivery, isPayAdmin } from '@/lib/pay/admin';
import { attempt } from '@/lib/pay/deliveries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Notifications not delivered yet (still retrying, or given up), newest first
export async function GET(req: NextRequest) {
  if (!(await isPayAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await db.payDelivery.findMany({
    where: { deliveredAt: null },
    orderBy: { id: 'desc' },
    take: 100,
    include: { app: { select: { name: true, webhookUrl: true } } },
  });
  return NextResponse.json({ deliveries: rows.map(adminDelivery) });
}

// POST {"id":"<delivery id>"}: send it again now (also revives one that used up its retries)
export async function POST(req: NextRequest) {
  if (!(await isPayAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !/^\d+$/.test(String(body.id))) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const id = BigInt(body.id);
  const d = await db.payDelivery.findUnique({ where: { id } });
  if (!d) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!d.deliveredAt) {
    // Claimed so the cron does not send it at the same moment; on failure attempt() schedules the next retry
    await db.payDelivery.update({ where: { id }, data: { attempts: 0, nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000) } });
    await attempt(id);
  }
  const after = await db.payDelivery.findUnique({ where: { id }, include: { app: { select: { name: true, webhookUrl: true } } } });
  return NextResponse.json({ delivery: after ? adminDelivery(after) : null });
}

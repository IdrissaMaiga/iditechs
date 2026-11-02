import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { adminPayment, isPayAdmin } from '@/lib/pay/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE = 50;

// GET ?status=&provider=&app=&q=<reference or id>&before=<payment id>: newest first, 50 per page, plus totals
export async function GET(req: NextRequest) {
  if (!(await isPayAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const where: Prisma.PaymentWhereInput = {};
  if (sp.get('status')) where.status = sp.get('status')!;
  if (sp.get('provider')) where.provider = sp.get('provider')!;
  if (sp.get('app')) where.appId = sp.get('app')!;
  const q = sp.get('q')?.trim();
  if (q) where.OR = [{ id: q }, { reference: { contains: q, mode: 'insensitive' } }, { providerRef: q }];
  const before = sp.get('before');
  if (before) {
    const cursor = await db.payment.findUnique({ where: { id: before }, select: { createdAt: true } });
    if (cursor) where.createdAt = { lt: cursor.createdAt };
  }

  const rows = await db.payment.findMany({ where, orderBy: { createdAt: 'desc' }, take: PAGE + 1, include: { app: { select: { name: true } } } });

  // Money kept from payments made through IDITECHS Pay only, per currency: succeeded, minus refunds and card disputes
  // that took the money back (open or lost). Store and WhatsApp sales are not here: each application counts those.
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  type Row = { app_id: string; currency: string; amount: bigint | number; returned: bigint | number; count: bigint | number };
  const net = (from: Date) => db.$queryRaw<Row[]>`
    SELECT app_id, currency, SUM(amount) AS amount, COUNT(*) AS count,
           SUM(LEAST(amount, amount_refunded + CASE WHEN dispute_status IN ('needs_response', 'under_review', 'lost') THEN dispute_amount ELSE 0 END)) AS returned
      FROM pay_payments WHERE status = 'succeeded' AND completed_at >= ${from}
     GROUP BY app_id, currency`;
  const [todayRows, monthRows, allRows, byStatus] = await Promise.all([
    net(dayStart),
    net(monthStart),
    net(new Date(0)),
    db.payment.groupBy({ by: ['status'], _count: true }),
  ]);
  const byCurrency = (rows: Row[]) => {
    const m = new Map<string, { currency: string; amount: number; returned: number; count: number }>();
    for (const r of rows) {
      const cur = m.get(r.currency) ?? { currency: r.currency, amount: 0, returned: 0, count: 0 };
      cur.amount += Number(r.amount) - Number(r.returned);
      cur.returned += Number(r.returned);
      cur.count += Number(r.count);
      m.set(r.currency, cur);
    }
    return [...m.values()];
  };
  const returnedCount = await db.payment.count({ where: { status: 'succeeded', OR: [{ amountRefunded: { gt: 0 } }, { disputeStatus: { not: null } }] } });

  return NextResponse.json({
    payments: rows.slice(0, PAGE).map(adminPayment),
    next: rows.length > PAGE ? rows[PAGE - 1].id : null,
    totals: {
      today: byCurrency(todayRows),
      month: byCurrency(monthRows),
      all: byCurrency(allRows),
      by_app: allRows.map((r) => ({ app_id: r.app_id, currency: r.currency, amount: Number(r.amount) - Number(r.returned), returned: Number(r.returned), count: Number(r.count) })),
      by_status: Object.fromEntries(byStatus.map((x) => [x.status, x._count])),
      refunded_or_disputed: returnedCount,
    },
  });
}

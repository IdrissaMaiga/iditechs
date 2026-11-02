import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { adminPayment, isPayAdmin } from '@/lib/pay/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE = 50;

// An IANA timezone the runtime knows (e.g. "Europe/Budapest", "Africa/Bamako"), else null
function validTimeZone(tz: string | null): string | null {
  if (!tz || tz.length > 64 || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(tz)) return null;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

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
  // "Today" and "this month" in the viewer's timezone (?tz=Europe/Budapest, sent by the /pay screen), UTC otherwise
  const tz = validTimeZone(sp.get('tz')) ?? 'UTC';
  const [{ day_start: dayStart, month_start: monthStart }] = await db.$queryRaw<{ day_start: Date; month_start: Date }[]>`
    SELECT ((date_trunc('day', timezone(${tz}, now())) AT TIME ZONE ${tz}) AT TIME ZONE 'UTC') AS day_start,
           ((date_trunc('month', timezone(${tz}, now())) AT TIME ZONE ${tz}) AT TIME ZONE 'UTC') AS month_start`;
  type Row = { app_id: string; currency: string; amount: bigint | number; returned: bigint | number; count: bigint | number };
  // completed_at holds UTC without a timezone: compare with a plain UTC timestamp, so the database session's own
  // timezone setting can never shift the boundary
  const utc = (d: Date) => d.toISOString().replace('T', ' ').replace('Z', '');
  const net = (from: Date) => db.$queryRaw<Row[]>`
    SELECT app_id, currency, SUM(amount) AS amount, COUNT(*) AS count,
           SUM(LEAST(amount, amount_refunded + CASE WHEN dispute_status IN ('needs_response', 'under_review', 'lost') THEN dispute_amount ELSE 0 END)) AS returned
      FROM pay_payments WHERE status = 'succeeded' AND completed_at >= ${utc(from)}::timestamp
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

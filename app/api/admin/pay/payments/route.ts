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

  // Money actually received (succeeded), per currency: today, this month, all time, and per app
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sum = (from?: Date) =>
    db.payment.groupBy({
      by: ['currency'],
      where: { status: 'succeeded', ...(from ? { completedAt: { gte: from } } : {}) },
      _sum: { amount: true },
      _count: true,
    });
  const [today, month, all, byApp, byStatus] = await Promise.all([
    sum(dayStart),
    sum(monthStart),
    sum(),
    db.payment.groupBy({ by: ['appId', 'currency'], where: { status: 'succeeded' }, _sum: { amount: true }, _count: true }),
    db.payment.groupBy({ by: ['status'], _count: true }),
  ]);
  const shape = (g: { currency: string; _sum: { amount: number | null }; _count: number }[]) =>
    g.map((x) => ({ currency: x.currency, amount: x._sum.amount ?? 0, count: x._count }));

  return NextResponse.json({
    payments: rows.slice(0, PAGE).map(adminPayment),
    next: rows.length > PAGE ? rows[PAGE - 1].id : null,
    totals: {
      today: shape(today),
      month: shape(month),
      all: shape(all),
      by_app: byApp.map((x) => ({ app_id: x.appId, currency: x.currency, amount: x._sum.amount ?? 0, count: x._count })),
      by_status: Object.fromEntries(byStatus.map((x) => [x.status, x._count])),
    },
  });
}

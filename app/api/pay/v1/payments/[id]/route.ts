import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payRoute } from '@/lib/pay/http';
import { PayError, serialize } from '@/lib/pay/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = payRoute(async (_req, { app, params }) => {
  const payment = await db.payment.findFirst({ where: { id: String(params.id), appId: app.id } });
  if (!payment) throw new PayError(404, 'not_found', 'No such payment.');
  return NextResponse.json(serialize(payment));
});

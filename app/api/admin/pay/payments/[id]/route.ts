import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminDelivery, adminEvent, adminPayment, isPayAdmin } from '@/lib/pay/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// One payment with its full history: what the provider said, and every notification sent to the app
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPayAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const p = await db.payment.findUnique({
    where: { id: params.id },
    include: {
      app: { select: { name: true, webhookUrl: true } },
      events: { orderBy: { id: 'asc' } },
      deliveries: { orderBy: { id: 'asc' }, include: { app: { select: { name: true, webhookUrl: true } } } },
    },
  });
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ payment: adminPayment(p), events: p.events.map(adminEvent), deliveries: p.deliveries.map(adminDelivery) });
}

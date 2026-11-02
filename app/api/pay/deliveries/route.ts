import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { deliverDue } from '@/lib/pay/deliveries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Retries app notifications that failed. Run every minute from cron with the admin key.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ sent: await deliverDue() });
}

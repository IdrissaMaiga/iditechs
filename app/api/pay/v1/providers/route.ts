import { NextResponse } from 'next/server';
import { payRoute } from '@/lib/pay/http';
import { availableConnectors } from '@/lib/pay/switches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The providers an app can use right now: keys set on the server and switched on by the owner
export const GET = payRoute(async () =>
  NextResponse.json({ providers: (await availableConnectors()).map((c) => ({ id: c.id, label: c.label, currencies: c.currencies })) }),
);

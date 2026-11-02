import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/admin-auth';
import { connectors, getConnector } from '@/lib/pay/connectors';
import { setSwitch, switchedOff } from '@/lib/pay/switches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function state() {
  const off = await switchedOff();
  return connectors.map((c) => ({
    id: c.id,
    label: c.label,
    configured: c.enabled(), // keys present in the server env
    switched_on: !off.includes(c.id), // the owner's switch
    available: c.enabled() && !off.includes(c.id), // what apps can use for new payments
  }));
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ providers: await state() });
}

// PUT {"provider":"wave","on":false}: switches a provider on or off for every app
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z.object({ provider: z.string(), on: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success || !getConnector(parsed.data.provider)) {
    return NextResponse.json({ error: `provider must be one of ${connectors.map((c) => c.id).join(', ')}, on must be true or false` }, { status: 400 });
  }
  await setSwitch(parsed.data.provider, parsed.data.on);
  return NextResponse.json({ providers: await state() });
}

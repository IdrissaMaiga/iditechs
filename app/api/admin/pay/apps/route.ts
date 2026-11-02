import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { hashKey } from '@/lib/pay/auth';
import { newId } from '@/lib/pay/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apps = await db.payApp.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, apiKeyPrefix: true, webhookUrl: true, active: true, createdAt: true, _count: { select: { payments: true } } },
  });
  return NextResponse.json({ apps });
}

// Issues credentials to an app that wants to take payments through IDITECHS Pay. The key and secret are shown once.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z
    .object({ name: z.string().trim().min(1).max(100), webhook_url: z.url().max(2000).optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'name required, webhook_url must be a URL' }, { status: 400 });
  const apiKey = `ik_live_${crypto.randomBytes(24).toString('base64url')}`;
  const webhookSecret = `whsec_${crypto.randomBytes(24).toString('base64url')}`;
  const app = await db.payApp.create({
    data: {
      id: newId('app', 6),
      name: parsed.data.name,
      apiKeyHash: hashKey(apiKey),
      apiKeyPrefix: apiKey.slice(0, 12),
      webhookUrl: parsed.data.webhook_url ?? null,
      webhookSecret,
    },
  });
  return NextResponse.json({ id: app.id, name: app.name, api_key: apiKey, webhook_secret: webhookSecret }, { status: 201 });
}

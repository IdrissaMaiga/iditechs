import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isPayAdmin } from '@/lib/pay/admin';
import { hashKey } from '@/lib/pay/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH {"active":false} blocks the app's key at once; {"webhook_url":"https://..."|null} changes where it is notified
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPayAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z
    .object({ active: z.boolean().optional(), webhook_url: z.url().max(2000).nullable().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'active must be true/false, webhook_url a URL or null' }, { status: 400 });
  const { active, webhook_url } = parsed.data;
  const app = await db.payApp.update({
    where: { id: params.id },
    data: { ...(active !== undefined ? { active } : {}), ...(webhook_url !== undefined ? { webhookUrl: webhook_url } : {}) },
    select: { id: true, name: true, active: true, webhookUrl: true },
  }).catch(() => null);
  if (!app) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ app });
}

// POST {"rotate":"api_key"|"webhook_secret"}: issues a new one (shown once); the old one stops working immediately
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPayAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z.object({ rotate: z.enum(['api_key', 'webhook_secret']) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'rotate must be api_key or webhook_secret' }, { status: 400 });
  if (parsed.data.rotate === 'api_key') {
    const apiKey = `ik_live_${crypto.randomBytes(24).toString('base64url')}`;
    const ok = await db.payApp.update({ where: { id: params.id }, data: { apiKeyHash: hashKey(apiKey), apiKeyPrefix: apiKey.slice(0, 12) } }).catch(() => null);
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ api_key: apiKey });
  }
  const webhookSecret = `whsec_${crypto.randomBytes(24).toString('base64url')}`;
  const ok = await db.payApp.update({ where: { id: params.id }, data: { webhookSecret } }).catch(() => null);
  if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ webhook_secret: webhookSecret });
}

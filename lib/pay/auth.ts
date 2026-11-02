import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import type { PayApp } from '@prisma/client';
import { db } from '@/lib/db';

export const hashKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

/** Apps authenticate with "Authorization: Bearer ik_live_...". Only the hash of the key is stored. */
export async function payApp(req: NextRequest): Promise<PayApp | null> {
  const key = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '')?.[1];
  if (!key) return null;
  const app = await db.payApp.findUnique({ where: { apiKeyHash: hashKey(key) } });
  return app?.active ? app : null;
}

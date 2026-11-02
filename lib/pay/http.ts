import { NextRequest, NextResponse } from 'next/server';
import type { PayApp } from '@prisma/client';
import { ZodError } from 'zod';
import { payApp } from './auth';
import { ProviderError } from './connectors/types';
import { PayError } from './payments';

type Ctx = { params: Record<string, string | string[]> };

/** Turns PayError / ZodError into JSON errors; with `auth`, resolves the calling app from its API key first. */
export function payRoute(handler: (req: NextRequest, ctx: Ctx & { app: PayApp }) => Promise<Response>): (req: NextRequest, ctx: Ctx) => Promise<Response>;
export function payRoute(handler: (req: NextRequest, ctx: Ctx) => Promise<Response>, auth: false): (req: NextRequest, ctx: Ctx) => Promise<Response>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function payRoute(handler: (req: NextRequest, ctx: any) => Promise<Response>, auth = true) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      if (!auth) return await handler(req, ctx);
      const app = await payApp(req);
      if (!app) return NextResponse.json({ error: 'unauthorized', message: 'Missing or invalid API key.' }, { status: 401 });
      return await handler(req, { ...ctx, app });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'invalid_request', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }, { status: 400 });
      }
      if (err instanceof PayError) return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
      if (err instanceof ProviderError || (err instanceof Error && err.name === 'TimeoutError')) {
        console.error(err.message, err instanceof ProviderError ? JSON.stringify(err.detail) : '');
        return NextResponse.json({ error: 'provider_error', message: 'The payment provider did not answer. Try again later.' }, { status: 502 });
      }
      console.error(err);
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
  };
}

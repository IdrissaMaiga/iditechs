import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { payRoute } from '@/lib/pay/http';
import { createPayment, PayError, serialize } from '@/lib/pay/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const url = z.url().max(2000);
const schema = z.object({
  provider: z.string().max(40),
  amount: z.number().int().positive().max(100_000_000),
  currency: z.string().length(3).default('XOF'),
  reference: z.string().trim().min(1).max(100),
  description: z.string().trim().max(200).default(''),
  return_url: url,
  cancel_url: url.optional(),
  customer: z.object({ phone: z.string().max(32).optional(), email: z.email().max(200).optional(), name: z.string().max(200).optional() }).default({}),
  metadata: z.record(z.string(), z.union([z.string().max(500), z.number(), z.boolean()])).default({}),
});

export const POST = payRoute(async (req, { app }) => {
  const body = schema.parse(await req.json().catch(() => null));
  const payment = await createPayment(app, {
    provider: body.provider,
    amount: body.amount,
    currency: body.currency,
    reference: body.reference,
    description: body.description,
    returnUrl: body.return_url,
    cancelUrl: body.cancel_url,
    customer: body.customer,
    metadata: body.metadata,
  });
  return NextResponse.json(serialize(payment), { status: 201 });
});

// GET /api/pay/v1/payments?reference=<the app's order id>
export const GET = payRoute(async (req, { app }) => {
  const reference = z.string().min(1).max(100).parse(req.nextUrl.searchParams.get('reference'));
  const payment = await db.payment.findUnique({ where: { appId_reference: { appId: app.id, reference } } });
  if (!payment) throw new PayError(404, 'not_found', 'No such payment.');
  return NextResponse.json(serialize(payment));
});

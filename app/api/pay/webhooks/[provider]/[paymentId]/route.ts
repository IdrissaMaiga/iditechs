import { payRoute } from '@/lib/pay/http';
import { handleWebhook } from '@/lib/pay/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Orange Money calls back on a per-payment URL (notif_url)
export const POST = payRoute((req, { params }) => handleWebhook(req, String(params.provider), String(params.paymentId)), false);

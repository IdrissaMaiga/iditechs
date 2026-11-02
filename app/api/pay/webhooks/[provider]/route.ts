import { payRoute } from '@/lib/pay/http';
import { handleWebhook } from '@/lib/pay/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Wave and Stripe: register <PAY_PUBLIC_URL>/webhooks/wave and /webhooks/stripe in their dashboards
export const POST = payRoute((req, { params }) => handleWebhook(req, String(params.provider)), false);

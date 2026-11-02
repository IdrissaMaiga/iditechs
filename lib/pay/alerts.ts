import { getMcp } from '@/lib/whatsapp/mcp';

/**
 * WhatsApp alerts to the owner, sent from the IDITECHS business line (WA_INSTANCE_ID, inst_e715928d) to WA_ADMIN_NUMBER:
 * the same line and number as the Djarabi and Yorognini admin alerts. Never the owner's personal instance.
 * Logged only when not configured. Never throws: an alert must not break a payment.
 */
export async function alertOwner(text: string) {
  const instanceId = process.env.WA_INSTANCE_ID ?? '';
  const to = (process.env.WA_ADMIN_NUMBER ?? '').replace(/\D/g, '');
  if (!instanceId || !to) {
    console.log(`[pay alert] ${text}`);
    return;
  }
  try {
    const mcp = await getMcp();
    await mcp.call('wa_send_text', { instanceId, to, text: `IDITECHS Pay : ${text}` });
  } catch (err) {
    console.error('pay alert failed', err instanceof Error ? err.message : err);
  }
}

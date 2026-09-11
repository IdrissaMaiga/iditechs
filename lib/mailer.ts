// App email sender — routes through OUR OWN mail server (Stalwart @ mail.iditechs.com),
// not a third party. Auth is a dedicated no-reply mailbox. Username is the login NAME
// (e.g. "noreply"), not the email address.
import nodemailer from "nodemailer";

const HOST = process.env.SMTP_HOST || "mail.iditechs.com";
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER || "noreply";
const PASS = process.env.SMTP_PASS || "";
const FROM = process.env.SMTP_FROM || '"Idrissa Maiga" <noreply@iditechs.com>';

let transporter: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter | null {
  if (!PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465, // 465 implicit TLS, 587 STARTTLS
      auth: { user: USER, pass: PASS },
    });
  }
  return transporter;
}

/** True when the app mail server credentials are configured. */
export function mailConfigured(): boolean {
  return !!PASS;
}

export type MailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  from?: string;
};

/** Send an email through the own mail server. Throws if not configured or the send fails. */
export async function sendMail(opts: MailInput): Promise<void> {
  const t = getTransport();
  if (!t) throw new Error("mail_not_configured");
  await t.sendMail({
    from: opts.from || FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
  });
}

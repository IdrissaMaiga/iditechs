/* eslint-disable @typescript-eslint/no-explicit-any */
// JMAP client for Stalwart, via the token-gated public gateway (mailapi.iditechs.com).
// Runs in the portfolio's server routes (Vercel) — the gateway token + per-user Basic
// auth are the access controls; the token is never sent to the browser.
const BASE = process.env.STALWART_URL || "https://mailapi.iditechs.com";
const GW = process.env.STALWART_GATEWAY_TOKEN || "";
const MAIL = "urn:ietf:params:jmap:mail";
const SUBMISSION = "urn:ietf:params:jmap:submission";
const CORE = "urn:ietf:params:jmap:core";

export type Creds = { email: string; password: string };
const PRINCIPALS = "urn:ietf:params:jmap:principals";

/** The Stalwart super-admin credential — can read/enumerate/send for ALL mailboxes. */
export function adminCreds(): Creds {
  return { email: process.env.STALWART_ADMIN_USER || "", password: process.env.STALWART_ADMIN_SECRET || "" };
}

export type MailAccount = { accountId: string; name: string; email: string; description: string | null };

/** Every individual mailbox on the domain, with its JMAP accountId (admin-enumerated). */
export async function listAccounts(): Promise<MailAccount[]> {
  const admin = adminCreds();
  const sess = await getSession(admin); // admin's own account id, used to scope Principal/*
  const r = await request(admin, [
    ["Principal/query", { accountId: sess.accountId, filter: {} }, "0"],
    ["Principal/get", { accountId: sess.accountId, "#ids": { resultOf: "0", name: "Principal/query", path: "/ids" } }, "1"],
  ], [CORE, PRINCIPALS]);
  const list = r.methodResponses?.[1]?.[1]?.list ?? [];
  const domain = (process.env.MAIL_DOMAIN || "iditechs.com").toLowerCase();
  return list
    .filter((p: any) => p.type === "individual" && typeof p.email === "string" && p.email.toLowerCase().endsWith(`@${domain}`))
    .map((p: any) => ({ accountId: p.id, name: p.name, email: p.email, description: p.description ?? null }))
    .sort((a: MailAccount, b: MailAccount) => a.email.localeCompare(b.email));
}

function headers(c: Creds, extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: "Basic " + Buffer.from(`${c.email}:${c.password}`).toString("base64"),
    "X-Gateway-Token": GW,
    ...extra,
  };
}

export type Session = { accountId: string };

export async function getSession(c: Creds): Promise<Session> {
  const res = await fetch(`${BASE}/jmap/session`, {
    headers: headers(c, { Accept: "application/json" }),
    redirect: "follow",
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("invalid_credentials");
  if (res.status === 403) throw new Error("gateway_forbidden");
  if (!res.ok) throw new Error(`session_failed_${res.status}`);
  const data = await res.json();
  const accountId = data?.primaryAccounts?.[MAIL];
  if (!accountId) throw new Error("no_mail_account");
  return { accountId };
}

async function request(c: Creds, methodCalls: unknown[], using: string[] = [CORE, MAIL]): Promise<any> {
  const res = await fetch(`${BASE}/jmap/`, {
    method: "POST",
    headers: headers(c, { "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify({ using, methodCalls }),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("invalid_credentials");
  if (!res.ok) throw new Error(`jmap_${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export type Mailbox = {
  id: string; name: string; role: string | null;
  totalEmails: number; unreadEmails: number; sortOrder: number; parentId: string | null;
};

export async function listMailboxes(c: Creds, accountId: string): Promise<Mailbox[]> {
  const r = await request(c, [["Mailbox/get", { accountId, ids: null }, "0"]]);
  const list = r.methodResponses?.[0]?.[1]?.list ?? [];
  return list
    .map((m: any) => ({
      id: m.id, name: m.name, role: m.role ?? null,
      totalEmails: m.totalEmails ?? 0, unreadEmails: m.unreadEmails ?? 0,
      sortOrder: m.sortOrder ?? 99, parentId: m.parentId ?? null,
    }))
    .sort((a: Mailbox, b: Mailbox) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export type Addr = { name: string | null; email: string };
export type EmailSummary = {
  id: string; threadId: string; subject: string; from: Addr[]; to: Addr[];
  receivedAt: string; preview: string; unread: boolean; hasAttachment: boolean;
};

export async function listEmails(
  c: Creds, accountId: string, mailboxId: string, opts: { limit?: number; position?: number; q?: string } = {}
): Promise<{ emails: EmailSummary[]; total: number }> {
  const filter = opts.q ? { inMailbox: mailboxId, text: opts.q } : { inMailbox: mailboxId };
  const r = await request(c, [
    ["Email/query", { accountId, filter, sort: [{ property: "receivedAt", isAscending: false }], position: opts.position ?? 0, limit: opts.limit ?? 40, calculateTotal: true }, "0"],
    ["Email/get", { accountId, "#ids": { resultOf: "0", name: "Email/query", path: "/ids" }, properties: ["id", "threadId", "subject", "from", "to", "receivedAt", "preview", "keywords", "hasAttachment"] }, "1"],
  ]);
  const total = r.methodResponses?.[0]?.[1]?.total ?? 0;
  const list = r.methodResponses?.[1]?.[1]?.list ?? [];
  const emails: EmailSummary[] = list.map((m: any) => ({
    id: m.id, threadId: m.threadId, subject: m.subject || "(sans objet)",
    from: (m.from ?? []).map((a: any) => ({ name: a.name ?? null, email: a.email })),
    to: (m.to ?? []).map((a: any) => ({ name: a.name ?? null, email: a.email })),
    receivedAt: m.receivedAt, preview: (m.preview ?? "").trim(),
    unread: !(m.keywords?.["$seen"]), hasAttachment: !!m.hasAttachment,
  }));
  emails.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  return { emails, total };
}

export type FullEmail = EmailSummary & {
  cc: Addr[]; html: string | null; text: string | null;
  attachments: { name: string; type: string; size: number; blobId: string }[];
};

export async function getEmail(c: Creds, accountId: string, id: string): Promise<FullEmail | null> {
  const r = await request(c, [
    ["Email/get", { accountId, ids: [id], properties: ["id", "threadId", "subject", "from", "to", "cc", "receivedAt", "preview", "keywords", "hasAttachment", "htmlBody", "textBody", "bodyValues", "attachments"], fetchHTMLBodyValues: true, fetchTextBodyValues: true, maxBodyValueBytes: 700000 }, "0"],
  ]);
  const m = r.methodResponses?.[0]?.[1]?.list?.[0];
  if (!m) return null;
  const bv = m.bodyValues ?? {};
  const htmlPart = (m.htmlBody ?? []).find((p: any) => bv[p.partId]);
  const textPart = (m.textBody ?? []).find((p: any) => bv[p.partId]);
  await setKeyword(c, accountId, id, "$seen", true).catch(() => {});
  return {
    id: m.id, threadId: m.threadId, subject: m.subject || "(sans objet)",
    from: (m.from ?? []).map((a: any) => ({ name: a.name ?? null, email: a.email })),
    to: (m.to ?? []).map((a: any) => ({ name: a.name ?? null, email: a.email })),
    cc: (m.cc ?? []).map((a: any) => ({ name: a.name ?? null, email: a.email })),
    receivedAt: m.receivedAt, preview: m.preview ?? "", unread: false, hasAttachment: !!m.hasAttachment,
    html: htmlPart ? bv[htmlPart.partId].value : null,
    text: textPart ? bv[textPart.partId].value : null,
    attachments: (m.attachments ?? []).map((a: any) => ({ name: a.name || "fichier", type: a.type || "application/octet-stream", size: a.size || 0, blobId: a.blobId })),
  };
}

export async function setKeyword(c: Creds, accountId: string, id: string, keyword: string, on: boolean) {
  await request(c, [["Email/set", { accountId, update: { [id]: { [`keywords/${keyword}`]: on ? true : null } } }, "0"]]);
}
export async function moveEmail(c: Creds, accountId: string, id: string, mailboxId: string) {
  await request(c, [["Email/set", { accountId, update: { [id]: { mailboxIds: { [mailboxId]: true } } } }, "0"]]);
}
export async function deleteEmail(c: Creds, accountId: string, id: string) {
  const boxes = await listMailboxes(c, accountId);
  const trash = boxes.find((b) => b.role === "trash" || b.role === "junk");
  if (trash) return moveEmail(c, accountId, id, trash.id);
  await request(c, [["Email/set", { accountId, destroy: [id] }, "0"]]);
}

export type Uploaded = { blobId: string; type: string; size: number };
export type SendAttachment = { blobId: string; type: string; name: string };

/** Upload a file to the account's blob store; returns its blobId for use as an attachment. */
export async function uploadBlob(c: Creds, accountId: string, bytes: Buffer, mime: string): Promise<Uploaded> {
  const res = await fetch(`${BASE}/jmap/upload/${accountId}/`, {
    method: "POST",
    headers: headers(c, { "Content-Type": mime || "application/octet-stream" }),
    body: bytes as any,
  });
  if (res.status === 401) throw new Error("invalid_credentials");
  if (!res.ok) throw new Error(`upload_${res.status}: ${(await res.text()).slice(0, 150)}`);
  const d = await res.json();
  return { blobId: d.blobId, type: d.type || mime || "application/octet-stream", size: d.size ?? bytes.length };
}

/** Download an attachment's bytes (for streaming back to the browser). */
export async function getBlob(c: Creds, accountId: string, blobId: string, name: string): Promise<{ bytes: Buffer; type: string } | null> {
  const res = await fetch(`${BASE}/jmap/download/${accountId}/${blobId}/${encodeURIComponent(name || "file")}`, { headers: headers(c) });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") || "application/octet-stream";
  return { bytes: Buffer.from(await res.arrayBuffer()), type };
}

export async function sendEmail(
  c: Creds, accountId: string,
  msg: { to: Addr[]; cc?: Addr[]; subject: string; text: string; html?: string | null; attachments?: SendAttachment[] }
): Promise<void> {
  const boxes = await listMailboxes(c, accountId);
  const drafts = boxes.find((b) => b.role === "drafts");
  const sent = boxes.find((b) => b.role === "sent");
  if (!drafts) throw new Error("no_drafts_mailbox");
  const idr = await request(c, [["Identity/get", { accountId, ids: null }, "0"]], [CORE, SUBMISSION]);
  const identities = idr.methodResponses?.[0]?.[1]?.list ?? [];
  const identity = identities.find((i: any) => i.email?.toLowerCase() === c.email.toLowerCase()) ?? identities[0];
  if (!identity) throw new Error("no_identity");
  const bodyValues: Record<string, { value: string }> = { text: { value: msg.text } };
  if (msg.html) bodyValues.html = { value: msg.html };
  const bodyPart: any = msg.html
    ? { type: "multipart/alternative", subParts: [{ partId: "text", type: "text/plain" }, { partId: "html", type: "text/html" }] }
    : { partId: "text", type: "text/plain" };
  const atts = msg.attachments ?? [];
  const bodyStructure: any = atts.length
    ? { type: "multipart/mixed", subParts: [bodyPart, ...atts.map((a) => ({ blobId: a.blobId, type: a.type, name: a.name, disposition: "attachment" }))] }
    : bodyPart;
  const draft = {
    mailboxIds: { [drafts.id]: true }, keywords: { $draft: true, $seen: true },
    from: [{ name: identity.name || null, email: identity.email }],
    to: msg.to, cc: msg.cc && msg.cc.length ? msg.cc : undefined,
    subject: msg.subject, bodyStructure, bodyValues,
  };
  const r = await request(c, [
    ["Email/set", { accountId, create: { draft } }, "0"],
    ["EmailSubmission/set", { accountId, create: { sub: { identityId: identity.id, emailId: "#draft" } }, onSuccessUpdateEmail: sent ? { "#sub": { mailboxIds: { [sent.id]: true }, "keywords/$draft": null } } : undefined }, "1"],
  ], [CORE, MAIL, SUBMISSION]);
  const subErr = r.methodResponses?.[1]?.[1]?.notCreated?.sub;
  const emailErr = r.methodResponses?.[0]?.[1]?.notCreated?.draft;
  if (emailErr) throw new Error("draft_failed: " + JSON.stringify(emailErr).slice(0, 200));
  if (subErr) throw new Error("send_failed: " + JSON.stringify(subErr).slice(0, 200));
}

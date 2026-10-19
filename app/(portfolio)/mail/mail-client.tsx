"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  FiEdit, FiSettings, FiArrowLeft, FiMenu, FiRefreshCw, FiTrash2, FiCornerUpLeft,
  FiPaperclip, FiLogOut, FiSend, FiShuffle, FiInbox, FiFileText, FiAlertOctagon, FiArchive, FiFolder,
  FiChevronDown, FiCheck, FiX, FiDownload, FiCopy, FiEye, FiEyeOff, FiSearch, FiMail,
  FiAlertTriangle, FiSmartphone, FiChevronUp, FiMoreHorizontal,
} from "react-icons/fi";

const MAIL_HOST = "mail.iditechs.com";
const fmtSize = (n: number) => (n < 1024 ? `${n} o` : n < 1048576 ? `${(n / 1024).toFixed(0)} Ko` : `${(n / 1048576).toFixed(1)} Mo`);
const MAX_UPLOAD = 4_200_000; // Vercel serverless request-body limit (~4.5 MB) — stay under it

// Downscale/recompress large images in the browser so they fit under the upload limit.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1_200_000) return file;
  try {
    const img = await createImageBitmap(file);
    const maxDim = 1600;
    let { width, height } = img;
    if (Math.max(width, height) > maxDim) {
      const s = maxDim / Math.max(width, height);
      width = Math.round(width * s); height = Math.round(height * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.82));
    if (blob && blob.size < file.size) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch { /* keep original on failure */ }
  return file;
}

const FOLDER_ICON: Record<string, ReactNode> = {
  inbox: <FiInbox />, sent: <FiSend />, drafts: <FiFileText />,
  trash: <FiTrash2 />, junk: <FiAlertOctagon />, archive: <FiArchive />,
};
const FOLDER_FR: Record<string, string> = { inbox: "Boîte de réception", sent: "Envoyés", drafts: "Brouillons", trash: "Corbeille", junk: "Spam", archive: "Archives" };
// The server hands folders back in alphabetical English order (Trash before Inbox); show them the way every mail app does.
const ROLE_ORDER: Record<string, number> = { inbox: 0, drafts: 1, sent: 2, archive: 3, junk: 4, trash: 5 };

type Account = { accountId: string; name: string; email: string; description: string | null };
type Mailbox = { id: string; name: string; role: string | null; totalEmails: number; unreadEmails: number };
type Addr = { name: string | null; email: string };
type Summary = { id: string; subject: string; from: Addr[]; to: Addr[]; receivedAt: string; preview: string; unread: boolean; hasAttachment: boolean };
type Attachment = { name: string; type: string; size: number; blobId: string; cid: string | null; disposition: string | null };
type Full = Summary & { cc: Addr[]; html: string | null; text: string | null; attachments: Attachment[] };

const sortFolders = (list: Mailbox[]) =>
  [...list].sort((a, b) => (ROLE_ORDER[a.role ?? ""] ?? 9) - (ROLE_ORDER[b.role ?? ""] ?? 9) || a.name.localeCompare(b.name));
const addrLabel = (a: Addr[]) => (!a?.length ? "—" : a.map((x) => x.name || x.email).join(", "));
function fmtDate(s: string): string {
  const d = new Date(s), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("fr-FR", sameYear ? { day: "2-digit", month: "short" } : { day: "2-digit", month: "short", year: "numeric" });
}
const fmtFull = (s: string) => new Date(s).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
function initials(a: Addr[]): string {
  const s = (a?.[0]?.name || a?.[0]?.email || "?").trim();
  const parts = s.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? s[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}
const AV_COLORS = ["#4da6ff", "#22c55e", "#f59e0b", "#ec4899", "#a855f7", "#14b8a6", "#fb7185", "#38bdf8"];
function avatarColor(a: Addr[]): string {
  const s = (a?.[0]?.email || a?.[0]?.name || "?");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}
// Some senders put a text/html part that is really plain text; rendering that in the
// white iframe collapses every line break, so fall back to the text view for those.
const looksHtml = (html: string | null) => !!html && /<\s*(p|div|br|table|tr|td|img|a|span|h[1-6]|ul|ol|li|b|strong|em|i|font|blockquote|pre|hr)\b/i.test(html);
const stripTags = (html: string | null) => (html ?? "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

const attachmentUrl = (account: string, a: { blobId: string; name: string }, inline = false) =>
  `/api/mail/download?account=${account}&blobId=${encodeURIComponent(a.blobId)}&name=${encodeURIComponent(a.name)}${inline ? "&inline=1" : ""}`;

// Senders embed signature images as "cid:" references to attachment parts; point those at the download route.
function resolveCids(html: string, account: string, atts: Attachment[]): { html: string; inlineBlobs: Set<string> } {
  const inlineBlobs = new Set<string>();
  const byCid = new Map<string, Attachment>();
  for (const a of atts) if (a.cid) byCid.set(a.cid.replace(/^<|>$/g, ""), a);
  if (!byCid.size) return { html, inlineBlobs };
  const out = html.replace(/\b(src|background)=(["']?)cid:([^"'\s>]+)\2/gi, (m, attr: string, _q: string, cid: string) => {
    let key = cid;
    try { key = decodeURIComponent(cid); } catch { /* keep raw */ }
    const a = byCid.get(key);
    if (!a) return m;
    inlineBlobs.add(a.blobId);
    return `${attr}="${attachmentUrl(account, a, true)}"`;
  });
  return { html: out, inlineBlobs };
}

// Where the quoted thread starts (Outlook, Gmail, Apple Mail, Yahoo, Thunderbird, Proton).
const HTML_QUOTE_MARKERS = [
  /<div[^>]*\bid=["']?(?:divRplyFwdMsg|appendonsend)\b/i,
  /<div[^>]*\bclass=["'][^"']*\b(?:gmail_quote|yahoo_quoted|moz-cite-prefix|protonmail_quote)\b/i,
  /<blockquote[^>]*\b(?:type=["']?cite|class=["'][^"']*gmail_quote)/i,
];
function splitQuotedHtml(html: string): { main: string; quoted: string | null } {
  let cut = -1;
  for (const re of HTML_QUOTE_MARKERS) {
    const m = re.exec(html);
    if (m && (cut < 0 || m.index < cut)) cut = m.index;
  }
  if (cut < 0 || stripTags(html.slice(0, cut)).length < 2) return { main: html, quoted: null };
  return { main: html.slice(0, cut), quoted: html.slice(cut) };
}
const TEXT_QUOTE_START = /\n(?=-{2,}\s*(?:Original Message|Message d'origine|Message original)\s*-{2,}|(?:On|Le) [^\n]{0,200}(?:wrote|a écrit)\s?:\s*\n|(?:From|De)\s?: [^\n]+\n(?:Sent|Envoyé|Date)\s?:|>)/i;
function splitQuotedText(text: string): { main: string; quoted: string | null } {
  const m = TEXT_QUOTE_START.exec(text);
  if (!m || m.index < 2) return { main: text, quoted: null };
  return { main: text.slice(0, m.index).trimEnd(), quoted: text.slice(m.index) };
}

type Body = { kind: "html" | "text"; main: string; full: string; hasQuote: boolean; inlineBlobs: Set<string>; reflow: boolean };
function prepareBody(sel: Full, account: string): Body {
  if (looksHtml(sel.html)) {
    const { html, inlineBlobs } = resolveCids(sel.html!, account, sel.attachments);
    const { main, quoted } = splitQuotedHtml(html);
    // Plain correspondence (a signature table at most) reflows on phones; table-built newsletters are scaled instead.
    const reflow = (html.match(/<table\b/gi) ?? []).length <= 3;
    return { kind: "html", main, full: html, hasQuote: !!quoted, inlineBlobs, reflow };
  }
  const text = sel.text || stripTags(sel.html) || "(message vide)";
  const { main, quoted } = splitQuotedText(text);
  return { kind: "text", main, full: text, hasQuote: !!quoted, inlineBlobs: new Set(), reflow: false };
}

function post(body: Record<string, string>) {
  return fetch("/api/mail/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export function MailClient({ owner, accounts, initialAccount, initialFolder, initialEmail }: { owner: string; accounts: Account[]; initialAccount?: string; initialFolder?: string; initialEmail?: string }) {
  const resolvedInitialAccount = (initialAccount && accounts.some((a) => a.accountId === initialAccount)) ? initialAccount : accounts[0]?.accountId ?? "";
  const [account, setAccount] = useState(resolvedInitialAccount);
  const [folders, setFolders] = useState<Mailbox[]>([]);
  const [active, setActive] = useState(initialFolder ?? "");
  const [emails, setEmails] = useState<Summary[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Full | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [compose, setCompose] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [settings, setSettings] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);
  const initialEmailDone = useRef(false);

  const syncUrl = useCallback((acc: string, fld: string, emailId?: string) => {
    const p = new URLSearchParams();
    if (acc) p.set("account", acc);
    if (fld) p.set("folder", fld);
    if (emailId) p.set("email", emailId);
    const qs = p.toString();
    window.history.replaceState(null, "", "/mail" + (qs ? "?" + qs : ""));
  }, []);

  const loadFolders = useCallback(async (acc: string) => {
    if (!acc) return;
    setSel(null); setEmails([]); setQ("");
    const r = await fetch(`/api/mail/mailboxes?account=${acc}`).then((x) => x.json()).catch(() => ({ ok: false }));
    if (!r.ok) return;
    const sorted = sortFolders(r.mailboxes);
    setFolders(sorted);
    if (initialFolder && sorted.some((m) => m.id === initialFolder)) {
      setActive(initialFolder);
    } else {
      const inbox = sorted.find((m) => m.role === "inbox") ?? sorted[0];
      setActive(inbox ? inbox.id : "");
    }
  }, [initialFolder]);

  const loadList = useCallback(async (acc: string, mb: string, query: string, position = 0) => {
    if (!acc || !mb) return;
    if (position === 0) { setLoadingList(true); setSel(null); } else setLoadingMore(true);
    const p = new URLSearchParams({ account: acc, mailbox: mb, position: String(position) });
    if (query) p.set("q", query);
    const r = await fetch(`/api/mail/list?${p}`).then((x) => x.json()).catch(() => ({ ok: false }));
    if (position === 0) setLoadingList(false); else setLoadingMore(false);
    if (r.ok) {
      setEmails((prev) => (position === 0 ? r.emails : [...prev, ...r.emails]));
      setTotal(r.total);
    }
  }, []);

  useEffect(() => { if (account) loadFolders(account); }, [account, loadFolders]);
  useEffect(() => {
    if (!account || !active) return;
    const t = setTimeout(() => loadList(account, active, q), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [account, active, q, loadList]);

  useEffect(() => { syncUrl(account, active, sel?.id); }, [account, active, sel, syncUrl]);

  useEffect(() => {
    if (initialEmailDone.current || !initialEmail || !emails.length) return;
    initialEmailDone.current = true;
    if (emails.some((e) => e.id === initialEmail)) openEmail(initialEmail);
  }, [emails, initialEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || compose) return;
      if (showFolders) setShowFolders(false);
      else if (sel) setSel(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [compose, sel, showFolders]);

  async function openEmail(id: string) {
    setLoadingMsg(true);
    const r = await fetch(`/api/mail/get?account=${account}&id=${id}`).then((x) => x.json()).catch(() => ({ ok: false }));
    setLoadingMsg(false);
    if (r.ok) {
      const wasUnread = emails.find((e) => e.id === id)?.unread;
      setSel(r.email);
      setShowQuoted(false);
      setEmails((p) => p.map((e) => (e.id === id ? { ...e, unread: false } : e)));
      if (wasUnread) setFolders((p) => p.map((f) => (f.id === active ? { ...f, unreadEmails: Math.max(0, f.unreadEmails - 1) } : f)));
    }
  }
  function removeFromList(id: string) {
    setSel(null);
    setEmails((p) => p.filter((e) => e.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    setFolders((p) => p.map((f) => (f.id === active ? { ...f, totalEmails: Math.max(0, f.totalEmails - 1) } : f)));
  }
  async function del(id: string) {
    await post({ account, action: "delete", id });
    removeFromList(id);
  }
  async function archive(id: string) {
    const arch = folders.find((f) => f.role === "archive");
    if (!arch) return;
    await post({ account, action: "move", id, mailboxId: arch.id });
    removeFromList(id);
  }
  async function markUnread(id: string) {
    await post({ account, action: "read", id, value: "false" });
    setSel(null);
    setEmails((p) => p.map((e) => (e.id === id ? { ...e, unread: true } : e)));
    setFolders((p) => p.map((f) => (f.id === active ? { ...f, unreadEmails: f.unreadEmails + 1 } : f)));
  }

  const activeFolder = folders.find((f) => f.id === active);
  const folderName = activeFolder ? (FOLDER_FR[activeFolder.role ?? ""] || activeFolder.name) : "";
  const currentAccount = accounts.find((a) => a.accountId === account);
  const currentEmail = currentAccount?.email ?? "";
  const canArchive = folders.some((f) => f.role === "archive") && activeFolder?.role !== "archive";
  const body = useMemo(() => (sel ? prepareBody(sel, account) : null), [sel, account]);
  const visibleAtts = sel && body ? sel.attachments.filter((a) => !body.inlineBlobs.has(a.blobId)) : [];

  if (admin) return <Admin onBack={() => setAdmin(false)} />;
  if (settings) return <Settings account={currentAccount} onBack={() => setSettings(false)} />;

  return (
    <div className={`shell ${sel ? "has-reader" : ""} ${showFolders ? "show-folders" : ""}`}>
      <div className="scrim" onClick={() => setShowFolders(false)} />

      <aside className="sidebar">
        <div className="side-top">
          <span className="brand">iDi<b>Techs</b> Mail</span>
          <button className="icon-btn side-close" onClick={() => setShowFolders(false)} aria-label="Fermer les dossiers"><FiX /></button>
        </div>
        <div className="side-actions">
          <AccountSwitcher accounts={accounts} account={account} onChange={(id) => { setAccount(id); setShowFolders(false); }} />
          <button className="compose-btn btn-primary" onClick={() => { setCompose(true); setShowFolders(false); }}><FiEdit /> Nouveau message</button>
        </div>
        <nav className="folders" aria-label="Dossiers">
          {folders.map((f) => (
            <button key={f.id} className={`folder ${f.id === active ? "active" : ""}`} onClick={() => { setActive(f.id); setQ(""); setShowFolders(false); }}>
              <span className="folder-label">{FOLDER_ICON[f.role ?? ""] ?? <FiFolder />}<span className="folder-name">{FOLDER_FR[f.role ?? ""] || f.name}</span></span>
              {f.unreadEmails > 0 ? <span className="unread">{f.unreadEmails}</span> : <span className="count">{f.totalEmails || ""}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="me" title={owner}>{owner}</span>
          <button onClick={() => setAdmin(true)}><FiSettings /> Gérer les boîtes</button>
          <button onClick={() => setSettings(true)}><FiSmartphone /> Configurer un appareil</button>
          <a href="/"><FiArrowLeft /> Retour au site</a>
          <button onClick={() => signOut({ callbackUrl: "/" })}><FiLogOut /> Se déconnecter</button>
        </div>
      </aside>

      <section className="list">
        <div className="list-head">
          <div className="lh-left">
            <button className="menu-btn icon-btn" onClick={() => setShowFolders(true)} aria-label="Ouvrir les dossiers"><FiMenu /></button>
            <div className="lh-titles">
              <span className="lh-title">{folderName || "…"}</span>
              <span className="lh-sub">{currentEmail}</span>
            </div>
          </div>
          <div className="lh-right">
            {activeFolder && activeFolder.unreadEmails > 0 && (
              <span className="lh-unread">{activeFolder.unreadEmails} non lu{activeFolder.unreadEmails > 1 ? "s" : ""}</span>
            )}
            <button className={`icon-btn ${loadingList ? "spin" : ""}`} onClick={() => loadList(account, active, q)} title="Rafraîchir" aria-label="Rafraîchir"><FiRefreshCw /></button>
          </div>
        </div>
        <div className="search">
          <FiSearch className="search-ic" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={folderName ? `Rechercher dans ${folderName}` : "Rechercher"} aria-label="Rechercher" />
          {q && <button className="icon-btn search-x" onClick={() => setQ("")} aria-label="Effacer la recherche"><FiX /></button>}
        </div>
        <div className="msgs">
          {loadingList && emails.length === 0 ? (
            <Skeleton />
          ) : emails.length === 0 ? (
            <div className="empty"><FiInbox /><p>{q ? "Aucun résultat." : "Aucun message."}</p></div>
          ) : (
            <>
              {emails.map((m) => {
                const who = activeFolder?.role === "sent" || activeFolder?.role === "drafts" ? m.to : m.from;
                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    className={`msg ${m.unread ? "unread" : ""} ${sel?.id === m.id ? "active" : ""}`}
                    onClick={() => openEmail(m.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEmail(m.id); } }}
                  >
                    <div className="msg-av" style={{ background: avatarColor(who) }}>{initials(who)}</div>
                    <div className="msg-body">
                      <div className="msg-row1">
                        <span className="msg-from">{addrLabel(who)}</span>
                        <span className="msg-date">{fmtDate(m.receivedAt)}</span>
                      </div>
                      <div className="msg-subj">{m.hasAttachment && <FiPaperclip className="clip" />}{m.subject}</div>
                      <div className="msg-prev">{m.preview || " "}</div>
                    </div>
                  </div>
                );
              })}
              {emails.length < total && (
                <button className="more" disabled={loadingMore} onClick={() => loadList(account, active, q, emails.length)}>
                  {loadingMore ? "Chargement…" : `Afficher plus (${emails.length} sur ${total})`}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <section className="reader">
        {loadingMsg ? (
          <div className="placeholder"><span className="spinner" /><p>Ouverture…</p></div>
        ) : !sel ? (
          <div className="placeholder"><FiMail /><p>Sélectionnez un message</p><span>Il s&apos;ouvrira ici.</span></div>
        ) : (
          <>
            <div className="reader-head">
              <div className="reader-top">
                <button className="back-btn icon-btn" onClick={() => setSel(null)} aria-label="Retour à la liste"><FiArrowLeft /></button>
                <h2 className="reader-subj">{sel.subject}</h2>
              </div>
              <div className="reader-sender">
                <div className="reader-av" style={{ background: avatarColor(sel.from) }}>{initials(sel.from)}</div>
                <div className="reader-meta">
                  <div className="reader-who">
                    <b>{sel.from[0]?.name || sel.from[0]?.email || "—"}</b>
                    {sel.from[0]?.name && <span className="reader-addr">{sel.from[0].email}</span>}
                  </div>
                  <div className="reader-to">À : {addrLabel(sel.to)}{sel.cc.length ? ` · Cc : ${addrLabel(sel.cc)}` : ""}</div>
                </div>
                <span className="reader-date">{fmtFull(sel.receivedAt)}</span>
              </div>
              <div className="reader-actions">
                <button onClick={() => setCompose(true)}><FiCornerUpLeft /> Répondre</button>
                <button onClick={() => markUnread(sel.id)}><FiMail /> Non lu</button>
                {canArchive && <button onClick={() => archive(sel.id)}><FiArchive /> Archiver</button>}
                <button className="btn-danger" onClick={() => del(sel.id)}><FiTrash2 /> Supprimer</button>
              </div>
            </div>
            <div className="reader-body">
              {body!.kind === "html" ? (
                <HtmlBody html={showQuoted ? body!.full : body!.main} reflow={body!.reflow} />
              ) : (
                <div className="reader-text">{showQuoted ? body!.full : body!.main}</div>
              )}
              {body!.hasQuote && (
                <button className="quote-toggle" onClick={() => setShowQuoted((v) => !v)}>
                  {showQuoted ? <><FiChevronUp /> Masquer le message cité</> : <><FiMoreHorizontal /> Afficher le message cité</>}
                </button>
              )}
              {visibleAtts.length > 0 && (
                <div className="attach">
                  {visibleAtts.map((a, i) => (
                    <a key={i} className="attach-chip dl" href={attachmentUrl(account, a)} target="_blank" rel="noopener noreferrer" title={`${a.name} · ${fmtSize(a.size)}`}>
                      <FiPaperclip /><span className="attach-name">{a.name}</span><span className="attach-size">{fmtSize(a.size)}</span><FiDownload />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <button className="fab btn-primary" onClick={() => setCompose(true)} aria-label="Nouveau message"><FiEdit /></button>

      {compose && (
        <Compose
          account={account}
          from={currentEmail}
          defaultTo={sel ? sel.from[0]?.email ?? "" : ""}
          defaultSubject={sel ? (sel.subject.startsWith("Re:") ? sel.subject : `Re: ${sel.subject}`) : ""}
          defaultBody={sel ? `\n\n----- Message d'origine -----\nDe : ${addrLabel(sel.from)}\nDate : ${fmtFull(sel.receivedAt)}\nObjet : ${sel.subject}\n\n${splitQuotedText(sel.text || stripTags(sel.html) || sel.preview || "").main.split("\n").map((l) => "> " + l).join("\n")}` : ""}
          onClose={() => setCompose(false)}
          onSent={() => setCompose(false)}
        />
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="skel" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="skel-row">
          <span className="skel-av" />
          <span className="skel-lines"><span style={{ width: "42%" }} /><span style={{ width: "78%" }} /><span style={{ width: "60%" }} /></span>
        </div>
      ))}
    </div>
  );
}

// Sized to its content so the message scrolls with the reader instead of inside a second scrollbar.
// `allow-same-origin` is what makes the height readable; scripts and forms stay blocked by the sandbox.
const REFLOW_CSS = "@media (max-width:640px){table{width:100%!important;max-width:100%!important;min-width:0!important}td,th{width:auto!important;min-width:0!important}div{max-width:100%!important}}";
function HtmlBody({ html, reflow }: { html: string; reflow: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);
  const fit = () => {
    try {
      const frame = ref.current, doc = frame?.contentDocument;
      if (!frame || !doc?.body) return;
      // Newsletters laid out at fixed widths wider than the reader get scaled down instead of clipped.
      doc.body.style.setProperty("zoom", "");
      const over = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth) / Math.max(1, frame.clientWidth);
      if (over > 1.02) doc.body.style.setProperty("zoom", String(1 / over));
      setHeight(Math.min(30000, Math.max(120, doc.documentElement.scrollHeight + 24)));
    } catch { /* navigated away from srcdoc; keep last height */ }
  };
  return (
    <iframe
      ref={ref}
      onLoad={fit}
      style={{ height }}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><meta name="color-scheme" content="light"><style>html{overflow-y:hidden}body{margin:18px 20px;font-family:-apple-system,Segoe UI,system-ui,sans-serif;color:#1a1a1a;line-height:1.55;word-break:break-word;overflow-x:auto}a{color:#2b6df6}img{max-width:100%;height:auto}pre{white-space:pre-wrap}blockquote{margin:8px 0 8px 4px;padding-left:12px;border-left:3px solid #d6d6d6;color:#444}@media (max-width:640px){body{margin:12px}}${reflow ? REFLOW_CSS : ""}</style></head><body>${html}</body></html>`}
      title="message"
    />
  );
}

function AccountSwitcher({ accounts, account, onChange }: { accounts: Account[]; account: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = accounts.find((a) => a.accountId === account);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const av = (email: string): Addr[] => [{ name: null, email }];
  return (
    <div className="acct-switch-wrap" ref={ref}>
      <button className="acct-switch" onClick={() => setOpen((o) => !o)} title="Choisir une boîte" aria-haspopup="listbox" aria-expanded={open}>
        <span className="acct-av" style={{ background: avatarColor(av(cur?.email ?? "")) }}>{initials(av(cur?.email ?? "?"))}</span>
        <span className="acct-email">{cur?.email ?? "—"}</span>
        <FiChevronDown className="acct-chev" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="acct-menu" role="listbox">
          {accounts.map((a) => (
            <button key={a.accountId} role="option" aria-selected={a.accountId === account} className={`acct-item ${a.accountId === account ? "active" : ""}`} onClick={() => { onChange(a.accountId); setOpen(false); }}>
              <span className="acct-av" style={{ background: avatarColor(av(a.email)) }}>{initials(av(a.email))}</span>
              <span className="acct-email">{a.email}</span>
              {a.accountId === account && <FiCheck className="acct-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Compose({ account, from, defaultTo, defaultSubject, defaultBody, onClose, onSent }: { account: string; from: string; defaultTo: string; defaultSubject: string; defaultBody: string; onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [text, setText] = useState(defaultBody);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const sendRef = useRef<() => void>(() => {});

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setBusy(true);
    const arr = await Promise.all(Array.from(list).map(compressImage));
    setFiles((p) => [...p, ...arr]);
    setBusy(false);
  }
  async function send() {
    if (sending || busy || !to.trim()) return;
    setError("");
    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > MAX_UPLOAD) {
      setError(`Pièces jointes trop lourdes (${fmtSize(total)}). Limite ~4 Mo au total via le web — réduisez ou envoyez en plusieurs fois.`);
      return;
    }
    setSending(true);
    const fd = new FormData();
    fd.append("account", account); fd.append("to", to); fd.append("cc", cc);
    fd.append("subject", subject); fd.append("text", text);
    files.forEach((f) => fd.append("files", f));
    let r: { ok?: boolean; error?: string };
    try {
      const res = await fetch("/api/mail/send", { method: "POST", body: fd });
      r = res.status === 413 ? { ok: false, error: "too_large" } : await res.json();
    } catch { r = { ok: false, error: "network" }; }
    setSending(false);
    if (r.ok) onSent();
    else setError(
      r.error === "no_recipient" ? "Destinataire invalide." :
      r.error === "too_large" ? "Pièces jointes trop lourdes (~4 Mo max via le web)." :
      r.error === "network" ? "Erreur réseau (fichier peut-être trop lourd)." :
      "Échec de l'envoi."
    );
  }
  sendRef.current = send;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendRef.current(); }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onClose]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Nouveau message" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Nouveau message</h3>
          <span className="tag">de {from}</span>
          <button className="icon-btn modal-x" onClick={onClose} aria-label="Fermer"><FiX /></button>
        </div>
        <div className="field"><label htmlFor="c-to">À</label><input id="c-to" autoFocus={!defaultTo} placeholder="destinataire@exemple.com" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field"><label htmlFor="c-cc">Cc</label><input id="c-cc" placeholder="optionnel" value={cc} onChange={(e) => setCc(e.target.value)} /></div>
        <div className="field"><label htmlFor="c-subj">Objet</label><input id="c-subj" placeholder="Objet du message" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <textarea autoFocus={!!defaultTo} placeholder="Votre message…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        {files.length > 0 && (
          <div className="attach-list">
            {files.map((f, i) => (
              <div key={i} className="attach-chip">
                <FiPaperclip />
                <span className="attach-name">{f.name}</span>
                <span className="attach-size">{fmtSize(f.size)}</span>
                <button className="attach-x icon-btn" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} title="Retirer" aria-label={`Retirer ${f.name}`}><FiX /></button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="err">{error}</p>}
        <div className="modal-actions">
          <label className="btn attach-btn">
            <FiPaperclip /> {busy ? "Préparation…" : "Joindre"}
            <input type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <span className="hint">Ctrl + Entrée pour envoyer</span>
          <button onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={send} disabled={sending || busy || !to.trim()}><FiSend /> {sending ? "Envoi…" : "Envoyer"}</button>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ value, k, copied, onCopy }: { value: string; k: string; copied: string; onCopy: (v: string, k: string) => void }) {
  return <button className="icon-btn" onClick={() => onCopy(value, k)} title="Copier" aria-label="Copier">{copied === k ? <FiCheck /> : <FiCopy />}</button>;
}

function Settings({ account, onBack }: { account?: Account; onBack: () => void }) {
  const username = account?.name ?? "";
  const email = account?.email ?? "";
  const [pw, setPw] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState("");
  const copy = (v: string, k: string) => { navigator.clipboard?.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1200); };

  useEffect(() => {
    if (!username) return;
    fetch("/api/mail/admin").then((x) => x.json())
      .then((r) => { const b = r.ok ? r.mailboxes.find((m: { name: string }) => m.name === username) : null; setPw(b?.password ?? null); })
      .catch(() => setPw(null));
  }, [username]);

  const rows = (prefix: string) => [
    { label: "Serveur", value: MAIL_HOST, k: prefix + "srv" },
    { label: "Port", value: prefix === "i" ? "993" : "465", k: prefix + "port" },
    { label: "Sécurité", value: "SSL / TLS", k: prefix + "sec" },
    { label: "Nom d'utilisateur", value: username, k: prefix + "user" },
  ];

  return (
    <div className="admin-wrap">
      <div className="page-head">
        <div className="brand">Configurer <b>un appareil</b></div>
        <button onClick={onBack}><FiArrowLeft /> Retour au courrier</button>
      </div>
      <p className="cfg-intro">
        Ajoutez <b>{email || "votre boîte"}</b> à Gmail, Outlook ou Apple Mail avec ces paramètres IMAP.
        Le nom d&apos;utilisateur est <b>{username}</b>, pas l&apos;adresse complète : le serveur refuse la connexion avec l&apos;adresse.
      </p>
      <div className="cfg-note">
        <FiAlertTriangle />
        <div>
          <b>Un appareil déjà configuré ne se connecte plus ?</b> L&apos;ancien serveur <code>mail.agenticareer.com</code> n&apos;existe plus.
          Ouvrez les paramètres du compte sur l&apos;appareil et remplacez le serveur <i>entrant</i> et le serveur <i>sortant</i> par <code>{MAIL_HOST}</code>.
          Le mot de passe et le nom d&apos;utilisateur n&apos;ont pas changé.
        </div>
      </div>

      <div className="cfg-grid">
        <div>
          <h3 className="cfg-h">Réception (IMAP)</h3>
          <div className="cfg-card">
            {rows("i").map((r) => (
              <div className="cfg-row" key={r.k}>
                <span className="cfg-label">{r.label}</span>
                <span className="cfg-value">{r.value}</span>
                <CopyButton value={r.value} k={r.k} copied={copied} onCopy={copy} />
              </div>
            ))}
            <div className="cfg-row">
              <span className="cfg-label">Mot de passe</span>
              {pw ? (
                <>
                  <span className="cfg-value">{showPw ? pw : "••••••••••••"}</span>
                  <button className="icon-btn" onClick={() => setShowPw((s) => !s)} title={showPw ? "Masquer" : "Afficher"} aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPw ? <FiEyeOff /> : <FiEye />}</button>
                  <CopyButton value={pw} k="pw" copied={copied} onCopy={copy} />
                </>
              ) : (
                <span className="cfg-value dim">Gérer les boîtes → Définir</span>
              )}
            </div>
          </div>
        </div>
        <div>
          <h3 className="cfg-h">Envoi (SMTP)</h3>
          <div className="cfg-card">
            {rows("s").map((r) => (
              <div className="cfg-row" key={r.k}>
                <span className="cfg-label">{r.label}</span>
                <span className="cfg-value">{r.value}</span>
                <CopyButton value={r.value} k={r.k} copied={copied} onCopy={copy} />
              </div>
            ))}
            <div className="cfg-row">
              <span className="cfg-label">Mot de passe</span>
              <span className="cfg-value dim">identique à l&apos;IMAP</span>
            </div>
          </div>
          <p className="cfg-foot">Le port 587 avec STARTTLS fonctionne aussi pour l&apos;envoi.</p>
        </div>
      </div>

      <h3 className="cfg-h">Étapes</h3>
      <ol className="cfg-steps">
        <li>
          <b>Gmail (iPhone ou Android)</b> : photo de profil → <i>Ajouter un autre compte</i> → <i>Autre (IMAP)</i> → saisir {email || "l'adresse"} →
          nom d&apos;utilisateur <b>{username}</b>, mot de passe → serveur entrant <b>{MAIL_HOST}</b> port <b>993</b> (SSL) → serveur sortant <b>{MAIL_HOST}</b> port <b>465</b> (SSL).
        </li>
        <li>
          <b>Compte Gmail déjà configuré</b> : sur Android, Paramètres → le compte → <i>Paramètres du serveur entrant</i>, puis <i>sortant</i>.
          Sur iPhone, Gmail ne permet pas de modifier le serveur : photo de profil → <i>Gérer les comptes sur cet appareil</i> → retirer le compte, puis l&apos;ajouter à nouveau comme ci-dessus.
        </li>
        <li><b>Apple Mail (iPhone)</b> : Réglages → Apps → Mail → Comptes → Ajouter un compte → <i>Autre</i> → Ajouter un compte Mail → serveurs de réception et d&apos;envoi ci-dessus.</li>
        <li><b>Outlook</b> : Ajouter un compte → Options avancées → <i>Configurer manuellement</i> → IMAP.</li>
      </ol>
    </div>
  );
}

function Admin({ onBack }: { onBack: () => void }) {
  type Box = { id: number; name: string; emails: string[]; description: string | null; quota: number; usedQuota: number; password: string | null };
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");
  const gen = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; const a = new Uint32Array(16); crypto.getRandomValues(a); let s = ""; for (let i = 0; i < 16; i++) s += c[a[i] % c.length]; return s; };
  const mb = (b: number) => (b / 1048576).toFixed(1) + " Mo";
  const copy = (v: string, k: string) => { navigator.clipboard?.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1200); };
  const load = useCallback(async () => { setLoading(true); const r = await fetch("/api/mail/admin").then((x) => x.json()).catch(() => ({ ok: false })); setLoading(false); if (r.ok) setBoxes(r.mailboxes); }, []);
  useEffect(() => { setPw(gen()); load(); }, [load]);
  async function op(body: Record<string, string>, okMsg: string) {
    setBusy(true); setMsg("");
    const r = await fetch("/api/mail/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => ({ ok: false, error: "réseau" }));
    setBusy(false);
    if (r.ok) { setMsg(okMsg); await load(); } else setMsg("Erreur : " + (r.error || "inconnue"));
  }
  return (
    <div className="admin-wrap">
      <div className="page-head">
        <div className="brand">Boîtes <b>iditechs.com</b></div>
        <button onClick={onBack}><FiArrowLeft /> Retour au courrier</button>
      </div>

      <div className="card">
        <h3 className="card-h">Créer une boîte</h3>
        <div className="row create-row">
          <div className="field field-inline">
            <input placeholder="nom" value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} aria-label="Nom de la boîte" />
            <span className="suffix">@iditechs.com</span>
          </div>
          <input className="mono" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Mot de passe" />
          <button className="icon-btn" onClick={() => setPw(gen())} title="Générer un mot de passe" aria-label="Générer un mot de passe"><FiShuffle /></button>
          <button className="btn-primary" disabled={busy || !name || !pw} onClick={() => op({ op: "create", name, password: pw }, `Boîte ${name}@iditechs.com créée — mot de passe : ${pw}`)}>Créer</button>
        </div>
        {msg && <p className={`status ${msg.startsWith("Erreur") ? "bad" : "good"}`}>{msg}</p>}
      </div>

      <h3 className="cfg-h">Boîtes existantes</h3>
      {loading ? (
        <p className="dim">Chargement…</p>
      ) : (
        <div className="card table-card">
          <table>
            <thead><tr><th>Boîte</th><th>Mot de passe</th><th>Stockage</th><th /></tr></thead>
            <tbody>
              {boxes.map((b) => {
                const pct = b.quota ? Math.min(100, Math.round((b.usedQuota / b.quota) * 100)) : 0;
                return (
                  <tr key={b.id}>
                    <td><b>{b.name}</b><div className="dim small">{b.emails.join(", ")}</div></td>
                    <td>
                      {b.password ? (
                        <div className="pw-cell">
                          <code>{show[b.name] ? b.password : "••••••••••"}</code>
                          <button className="icon-btn" title={show[b.name] ? "Masquer" : "Afficher"} aria-label={show[b.name] ? "Masquer" : "Afficher"} onClick={() => setShow((s) => ({ ...s, [b.name]: !s[b.name] }))}>{show[b.name] ? <FiEyeOff /> : <FiEye />}</button>
                          <CopyButton value={b.password} k={b.name} copied={copied} onCopy={copy} />
                        </div>
                      ) : (
                        <button onClick={() => { const np = gen(); if (confirm(`Définir et enregistrer le mot de passe de ${b.name}@iditechs.com ?`)) op({ op: "reset", name: b.name, password: np }, `Mot de passe ${b.name} enregistré.`); }}>Définir</button>
                      )}
                    </td>
                    <td>
                      <div className="quota">
                        <div className="quota-bar"><span style={{ width: `${pct}%` }} /></div>
                        <span className="dim small">{mb(b.usedQuota)} / {mb(b.quota)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="row nowrap">
                        <button onClick={() => { const np = gen(); if (confirm(`Changer le mot de passe de ${b.name}@iditechs.com ?`)) op({ op: "reset", name: b.name, password: np }, `Nouveau mot de passe ${b.name} enregistré.`); }}>Changer MDP</button>
                        <button className="btn-danger" onClick={() => { if (confirm(`Supprimer définitivement ${b.name}@iditechs.com ?`)) op({ op: "delete", name: b.name }, `Boîte ${b.name} supprimée.`); }}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

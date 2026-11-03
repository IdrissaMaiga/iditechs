"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMessageSquare, FiPhoneMissed, FiBell, FiCheck, FiTrash2, FiSearch, FiSettings, FiCopy, FiRefreshCw, FiSmartphone } from "react-icons/fi";

type PhoneEvent = {
  id: string;
  kind: string;
  from: string;
  content: string;
  simInfo: string | null;
  device: string | null;
  receivedAt: string;
  read: boolean;
};

type Tab = "all" | "sms" | "call" | "app";

const REFRESH_MS = 15_000;
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <FiSmartphone size={14} /> },
  { key: "sms", label: "SMS", icon: <FiMessageSquare size={14} /> },
  { key: "call", label: "Calls", icon: <FiPhoneMissed size={14} /> },
  { key: "app", label: "Apps", icon: <FiBell size={14} /> },
];
const KIND_COLOR: Record<string, string> = { sms: "#3b82f6", call: "#f59e0b", app: "#a855f7" };

const TEMPLATE = `{"from":"[from]","content":"[content]","receive_time":"[receive_time]","card_slot":"[card_slot]","device_mark":"[device_mark]","timestamp":"[timestamp]","sign":"[sign]"}`;

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function PhoneClient({ initialEvents, webhookBase, configured }: { initialEvents: PhoneEvent[]; webhookBase: string; configured: boolean }) {
  const [events, setEvents] = useState(initialEvents);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [live, setLive] = useState(true);
  const [showSetup, setShowSetup] = useState(initialEvents.length === 0);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const params = new URLSearchParams({ kind: tab });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/phone?${params}`);
      const data = await res.json();
      if (data.ok) {
        setEvents(data.events);
        setUnread(data.unread ?? {});
        setLive(true);
      }
    } catch {
      setLive(false);
    } finally {
      inFlight.current = false;
    }
  }, [tab, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && load();
    const timer = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  useEffect(() => {
    if (!showSetup || secret !== null || !configured) return;
    fetch("/api/phone?setup=1")
      .then((r) => r.json())
      .then((d) => setSecret(d.secret ?? ""))
      .catch(() => setSecret(""));
  }, [showSetup, secret, configured]);

  const post = async (body: Record<string, unknown>) => {
    await fetch("/api/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
    await load();
  };

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const totalUnread = useMemo(() => Object.values(unread).reduce((a, b) => a + b, 0), [unread]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e5e5e5", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FiSmartphone size={26} color="#3b82f6" />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Phone notifications</h1>
            {!live && <span style={chip("#ef4444")}>offline</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} style={btn("#333")} title="Refresh"><FiRefreshCw size={15} /></button>
            {totalUnread > 0 && (
              <button onClick={() => post({ action: "read", kind: tab })} style={btn("#333")}><FiCheck size={15} /> Mark all read</button>
            )}
            <button onClick={() => setShowSetup(!showSetup)} style={btn(showSetup ? "#3b82f6" : "#333")}><FiSettings size={15} /> Setup</button>
          </div>
        </div>

        {showSetup && (
          <div style={{ ...card, marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Connect your Android phone (SmsForwarder)</h3>
            {!configured && <p style={{ color: "#fca5a5" }}>PHONE_WEBHOOK_SECRET is not set on the server: incoming messages are refused.</p>}
            <ol style={{ margin: "0 0 12px", paddingLeft: 20, color: "#bbb" }}>
              <li>Install SmsForwarder from its GitHub releases (it is not on Google Play) and grant SMS, call log, phone and notification access; disable battery optimisation for it.</li>
              <li>Add a <b>Webhook</b> sender for SMS: method POST, header <code>Content-Type: application/json</code>, the SMS URL, the secret and the template below.</li>
              <li>Add a second Webhook sender with the Calls URL (same secret, header and template). In the app settings enable <b>missed calls</b> only.</li>
              <li>Create two forwarding rules: SMS → SMS sender, Call → Calls sender. Use the sender&apos;s Test button: it appears here within seconds.</li>
            </ol>
            <Field label="SMS URL" value={`${webhookBase}?kind=sms`} k="sms" copied={copied} onCopy={copy} />
            <Field label="Calls URL" value={`${webhookBase}?kind=call`} k="call" copied={copied} onCopy={copy} />
            <Field label="App notifications URL (optional)" value={`${webhookBase}?kind=app`} k="app" copied={copied} onCopy={copy} />
            <Field label="Secret (sign)" value={secret === null ? "loading…" : secret || "(not set)"} k="secret" copied={copied} onCopy={copy} mono />
            <Field label="Request body template" value={TEMPLATE} k="tpl" copied={copied} onCopy={copy} mono />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {TABS.map((t) => {
            const n = t.key === "all" ? totalUnread : unread[t.key] ?? 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={btn(tab === t.key ? "#3b82f6" : "#1a1a25")}>
                {t.icon} {t.label}
                {n > 0 && <span style={{ ...chip("#ef4444"), marginLeft: 4 }}>{n}</span>}
              </button>
            );
          })}
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, ...input }}>
            <FiSearch size={14} color="#666" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number or text" style={{ background: "none", border: "none", outline: "none", color: "#e5e5e5", flex: 1, fontSize: 14 }} />
          </div>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
            <FiSmartphone size={44} style={{ marginBottom: 12 }} />
            <p>Nothing yet. Set up SmsForwarder (Setup) and send a test.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e) => (
              <div key={e.id} style={{ ...card, padding: 14, borderColor: e.read ? "#2a2a35" : "#3b82f6aa", opacity: e.read ? 0.8 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={chip(KIND_COLOR[e.kind] ?? "#666")}>{e.kind === "call" ? "call" : e.kind}</span>
                    <a href={`tel:${e.from}`} style={{ fontWeight: 600, color: "#e5e5e5", textDecoration: "none" }}>{e.from}</a>
                    <span style={{ fontSize: 12, color: "#666" }}>{when(e.receivedAt)}</span>
                    {e.simInfo && <span style={{ fontSize: 12, color: "#555" }}>{e.simInfo}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => post({ action: e.read ? "unread" : "read", id: e.id })} style={small} title={e.read ? "Mark unread" : "Mark read"}><FiCheck size={14} color={e.read ? "#22c55e" : "#888"} /></button>
                    <button onClick={() => copy(e.id, e.content)} style={small} title="Copy text">{copied === e.id ? <FiCheck size={14} color="#22c55e" /> : <FiCopy size={14} />}</button>
                    <button onClick={() => confirm("Delete this entry?") && post({ action: "delete", id: e.id })} style={small} title="Delete"><FiTrash2 size={14} color="#ef4444" /></button>
                  </div>
                </div>
                {e.content && <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14, color: "#ccc" }}>{e.content}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, k, copied, onCopy, mono }: { label: string; value: string; k: string; copied: string | null; onCopy: (k: string, v: string) => void; mono?: boolean }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <code style={{ ...input, flex: 1, fontFamily: mono ? "monospace" : undefined, fontSize: 12, wordBreak: "break-all" }}>{value}</code>
        <button onClick={() => onCopy(k, value)} style={small} title="Copy">{copied === k ? <FiCheck size={14} color="#22c55e" /> : <FiCopy size={14} />}</button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#111118", border: "1px solid #2a2a35", borderRadius: 12, padding: 20 };
const input: React.CSSProperties = { background: "#1a1a25", border: "1px solid #2a2a35", borderRadius: 8, padding: "8px 12px", color: "#e5e5e5" };
const small: React.CSSProperties = { background: "none", border: "1px solid #2a2a35", borderRadius: 6, color: "#888", cursor: "pointer", padding: 6, display: "inline-flex" };
const btn = (bg: string): React.CSSProperties => ({ background: bg, border: "none", borderRadius: 8, color: "#fff", padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 });
const chip = (color: string): React.CSSProperties => ({ background: `${color}22`, color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600 });

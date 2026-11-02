"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCreditCard, FiRefreshCw, FiLogOut, FiX, FiPlus, FiCheck, FiCopy, FiSend, FiKey, FiLock,
  FiPower, FiAlertTriangle, FiChevronRight, FiSearch,
} from "react-icons/fi";
import { signOut } from "next-auth/react";

type Provider = { id: string; label: string; configured: boolean; switched_on: boolean; available: boolean };
type App = { id: string; name: string; apiKeyPrefix: string; webhookUrl: string | null; active: boolean; createdAt: string; _count: { payments: number } };
type Money = { currency: string; amount: number; count: number; returned?: number };
type Payment = {
  id: string; app_id: string; app_name: string | null; reference: string; provider: string; provider_ref: string | null;
  amount: number; currency: string; description: string; status: string; checkout_url: string | null; return_url: string;
  amount_refunded: number; dispute: { status: string; amount: number } | null; amount_returned: number;
  customer: Record<string, string>; metadata: Record<string, unknown>; created_at: string; completed_at: string | null;
};
type PayEvent = { id: string; source: string; type: string; payload: unknown; created_at: string };
type Delivery = {
  id: string; payment_id: string; app_id: string; app_name: string | null; webhook_url: string | null; event_type: string;
  attempts: number; next_attempt_at: string; last_status: number | null; last_error: string | null; delivered_at: string | null; created_at: string;
};
type Totals = { today: Money[]; month: Money[]; all: Money[]; by_app: (Money & { app_id: string })[]; by_status: Record<string, number>; refunded_or_disputed: number };
type Tab = "overview" | "payments" | "apps" | "notifications";

const STATUS_COLORS: Record<string, string> = {
  succeeded: "#22c55e",
  pending: "#f59e0b",
  failed: "#ef4444",
  cancelled: "#6b7280",
  expired: "#6b7280",
};

// Amounts are stored in the smallest unit of the currency (FCFA for XOF, cents for EUR)
function money(amount: number, currency: string) {
  try {
    const f = new Intl.NumberFormat("fr-FR", { style: "currency", currency });
    return f.format(amount / 10 ** (f.resolvedOptions().maximumFractionDigits ?? 2));
  } catch {
    return `${amount} ${currency}`;
  }
}
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "-");
const moneyList = (list: Money[]) => (list.length ? list.map((m) => money(m.amount, m.currency)).join(" + ") : "0");

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export function PayClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filters, setFilters] = useState({ status: "", provider: "", app: "", q: "" });
  const [detail, setDetail] = useState<{ payment: Payment; events: PayEvent[]; deliveries: Delivery[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ title: string; lines: [string, string][] } | null>(null);
  const [newApp, setNewApp] = useState({ open: false, name: "", webhook: "" });
  const [editHook, setEditHook] = useState<{ id: string; url: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // Retry limit of app notifications, from the server (payConfig.delivery.maxAttempts)
  const [maxAttempts, setMaxAttempts] = useState(78);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(
    async (more = false) => {
      const sp = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
      if (more && next) sp.set("before", next);
      // "Kept today / this month" follow the timezone of this browser
      sp.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);
      const data = await call<{ payments: Payment[]; next: string | null; totals: Totals }>(`/api/admin/pay/payments?${sp}`);
      setPayments((prev) => (more ? [...prev, ...data.payments] : data.payments));
      setNext(data.next);
      setTotals(data.totals);
    },
    [filters, next],
  );

  const loadAll = useCallback(
    () =>
      run(async () => {
        const [p, a, d] = await Promise.all([
          call<{ providers: Provider[] }>("/api/admin/pay/providers"),
          call<{ apps: App[] }>("/api/admin/pay/apps"),
          call<{ deliveries: Delivery[]; max_attempts: number }>("/api/admin/pay/deliveries"),
        ]);
        setMaxAttempts(d.max_attempts);
        setProviders(p.providers);
        setApps(a.apps);
        setDeliveries(d.deliveries);
        await loadPayments();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on demand only, filters apply through "Search"
    [run],
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleProvider = (p: Provider) =>
    run(async () => {
      if (p.switched_on && !confirm(`Switch ${p.label} OFF for every app? New payments with it will be refused; payments already started still finish.`)) return;
      const data = await call<{ providers: Provider[] }>("/api/admin/pay/providers", { method: "PUT", body: JSON.stringify({ provider: p.id, on: !p.switched_on }) });
      setProviders(data.providers);
    });

  const openPayment = (id: string) =>
    run(async () => {
      setDetail(await call(`/api/admin/pay/payments/${encodeURIComponent(id)}`));
    });

  const retry = (d: Delivery) =>
    run(async () => {
      await call("/api/admin/pay/deliveries", { method: "POST", body: JSON.stringify({ id: d.id }) });
      const fresh = await call<{ deliveries: Delivery[] }>("/api/admin/pay/deliveries");
      setDeliveries(fresh.deliveries);
      if (detail) setDetail(await call(`/api/admin/pay/payments/${encodeURIComponent(detail.payment.id)}`));
    });

  const createApp = () =>
    run(async () => {
      const body: Record<string, string> = { name: newApp.name.trim() };
      if (newApp.webhook.trim()) body.webhook_url = newApp.webhook.trim();
      const data = await call<{ id: string; name: string; api_key: string; webhook_secret: string }>("/api/admin/pay/apps", { method: "POST", body: JSON.stringify(body) });
      setNewApp({ open: false, name: "", webhook: "" });
      setSecret({
        title: `${data.name} (${data.id}) is ready. Copy these into the app's own secrets now: they are not shown again.`,
        lines: [["IDITECHS_PAY_API_KEY", data.api_key], ["IDITECHS_PAY_WEBHOOK_SECRET", data.webhook_secret]],
      });
      setApps((await call<{ apps: App[] }>("/api/admin/pay/apps")).apps);
    });

  const patchApp = (app: App, body: Record<string, unknown>) =>
    run(async () => {
      await call(`/api/admin/pay/apps/${app.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditHook(null);
      setApps((await call<{ apps: App[] }>("/api/admin/pay/apps")).apps);
    });

  const rotate = (app: App, what: "api_key" | "webhook_secret") =>
    run(async () => {
      const label = what === "api_key" ? "API key" : "webhook secret";
      if (!confirm(`Replace the ${label} of ${app.name}? The old one stops working immediately, so update the app right after.`)) return;
      const data = await call<{ api_key?: string; webhook_secret?: string }>(`/api/admin/pay/apps/${app.id}`, { method: "POST", body: JSON.stringify({ rotate: what }) });
      setSecret({
        title: `New ${label} for ${app.name}. Copy it now: it is not shown again.`,
        lines: [[what === "api_key" ? "IDITECHS_PAY_API_KEY" : "IDITECHS_PAY_WEBHOOK_SECRET", (data.api_key ?? data.webhook_secret)!]],
      });
      setApps((await call<{ apps: App[] }>("/api/admin/pay/apps")).apps);
    });

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const appName = (id: string) => apps.find((a) => a.id === id)?.name ?? id;
  const failing = deliveries.filter((d) => d.attempts > 0);

  return (
    <div style={{ minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FiCreditCard size={28} color="#4da6ff" />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>IDITECHS Pay</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadAll} disabled={loading} className={loading ? "spin" : ""}>
              <FiRefreshCw /> Refresh
            </button>
            <button onClick={() => signOut()} className="icon-btn" title="Sign out">
              <FiLogOut />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {(["overview", "payments", "apps", "notifications"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-primary" : ""} style={{ textTransform: "capitalize" }}>
              {t === "apps" ? "our apps" : t}
              {t === "notifications" && failing.length > 0 && (
                <span style={tab === t ? { ...chip("#04101f"), background: "#fff" } : chip("#ef4444")}>{failing.length}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ ...card, borderColor: "#7f1d1d", background: "#2d1111", color: "#fca5a5", display: "flex", justifyContent: "space-between" }}>
            {error}
            <button onClick={() => setError(null)} className="icon-btn" style={{ height: 24, width: 24 }}>
              <FiX />
            </button>
          </div>
        )}

        {/* Secret shown once */}
        {secret && (
          <div style={{ ...card, borderColor: "#a16207", background: "#2a210d" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <strong style={{ color: "#fcd34d" }}>
                <FiKey style={{ verticalAlign: -2 }} /> {secret.title}
              </strong>
              <button onClick={() => setSecret(null)}>
                <FiCheck /> I saved them
              </button>
            </div>
            {secret.lines.map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <code className="mono" style={{ fontSize: 12, wordBreak: "break-all", flex: 1 }}>
                  {k}={v}
                </code>
                <button onClick={() => copy(k, `${k}=${v}`)} className="icon-btn" title="Copy">
                  {copiedKey === k ? <FiCheck color="#22c55e" /> : <FiCopy />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- Overview ---------------- */}
        {tab === "overview" && (
          <>
            <p style={{ color: "#9aa3b5", fontSize: 13, marginTop: 0 }}>
              IDITECHS Pay is the payment gateway of IDITECHS&apos;s own applications. This screen only counts money that went
              through IDITECHS Pay. Purchases made through other channels (Google Play, App Store, WhatsApp) are counted by
              each application, not here.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                ["Kept today", totals?.today ?? []],
                ["Kept this month", totals?.month ?? []],
                ["Kept, all time", totals?.all ?? []],
              ].map(([label, list]) => (
                <div key={label as string} style={card}>
                  <div style={{ color: "#9aa3b5", fontSize: 13 }}>{label as string}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{moneyList(list as Money[])}</div>
                  <div style={{ color: "#6a7284", fontSize: 12 }}>
                    {(list as Money[]).reduce((n, m) => n + m.count, 0)} payments succeeded
                    {(list as Money[]).some((m) => (m.returned ?? 0) > 0) &&
                      ` · ${moneyList((list as Money[]).filter((m) => (m.returned ?? 0) > 0).map((m) => ({ ...m, amount: m.returned ?? 0 })))} refunded or disputed`}
                  </div>
                </div>
              ))}
            </div>

            <h2 style={h2}>Payment methods</h2>
            <p style={{ color: "#9aa3b5", fontSize: 13, marginTop: -6 }}>
              Off = no app can start a new payment with it. Payments already started still finish.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {providers.map((p) => (
                <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <FiPower color={p.available ? "#22c55e" : "#6b7280"} />
                    <strong>{p.label}</strong>
                    <span style={chip(p.available ? "#22c55e" : "#6b7280")}>{p.available ? "available to apps" : "not available"}</span>
                    {!p.configured && (
                      <span style={chip("#f59e0b")}>
                        <FiAlertTriangle style={{ verticalAlign: -2, width: 11, height: 11 }} /> keys not set on the server
                      </span>
                    )}
                  </div>
                  <button onClick={() => toggleProvider(p)} disabled={loading} className={p.switched_on ? "btn-danger" : "btn-primary"}>
                    {p.switched_on ? "Switch off" : "Switch on"}
                  </button>
                </div>
              ))}
            </div>

            <h2 style={h2}>By status</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {Object.keys(STATUS_COLORS).map((s) => (
                <span key={s} style={{ ...chip(STATUS_COLORS[s]), fontSize: 13, padding: "4px 10px" }}>
                  {s}: {totals?.by_status[s] ?? 0}
                </span>
              ))}
              <span style={{ ...chip("#a855f7"), fontSize: 13, padding: "4px 10px" }}>refunded or disputed: {totals?.refunded_or_disputed ?? 0}</span>
            </div>

            <h2 style={h2}>Kept by app (through IDITECHS Pay)</h2>
            {(totals?.by_app ?? []).length === 0 ? (
              <p style={{ color: "#6a7284" }}>No payment received yet.</p>
            ) : (
              <div style={card}>
                {totals!.by_app.map((x) => (
                  <div key={x.app_id + x.currency} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span>{appName(x.app_id)}</span>
                    <span>
                      {money(x.amount, x.currency)} <span style={{ color: "#6a7284" }}>({x.count})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------------- Payments ---------------- */}
        {tab === "payments" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All statuses</option>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filters.provider} onChange={(e) => setFilters({ ...filters, provider: e.target.value })}>
                <option value="">All methods</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <select value={filters.app} onChange={(e) => setFilters({ ...filters, app: e.target.value })}>
                <option value="">All apps</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <input
                placeholder="Reference or payment id"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && run(() => loadPayments())}
                style={{ flex: 1, minWidth: 180 }}
              />
              <button onClick={() => run(() => loadPayments())} className="btn-primary" disabled={loading}>
                <FiSearch /> Search
              </button>
            </div>

            {payments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6a7284" }}>
                <FiCreditCard size={40} />
                <p>No payments{Object.values(filters).some(Boolean) ? " match these filters" : " yet"}.</p>
              </div>
            ) : (
              <div style={{ ...card, padding: 0, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#9aa3b5", textAlign: "left" }}>
                      {["Date", "App", "Reference", "Method", "Amount", "Status", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} onClick={() => openPayment(p.id)} style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={td}>{when(p.created_at)}</td>
                        <td style={td}>{p.app_name ?? p.app_id}</td>
                        <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{p.reference}</td>
                        <td style={td}>{providers.find((x) => x.id === p.provider)?.label ?? p.provider}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{money(p.amount, p.currency)}</td>
                        <td style={td}>
                          <span style={chip(STATUS_COLORS[p.status] ?? "#666")}>{p.status}</span>
                          <MoneyBackChip p={p} />
                        </td>
                        <td style={td}>
                          <FiChevronRight color="#6a7284" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {next && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => run(() => loadPayments(true))} disabled={loading}>Load more</button>
              </div>
            )}
          </>
        )}

        {/* ---------------- Apps ---------------- */}
        {tab === "apps" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
              <p style={{ color: "#9aa3b5", fontSize: 13, margin: 0 }}>
                IDITECHS&apos;s own applications that take payments through IDITECHS Pay. Each one has its own key and only sees its own payments.
              </p>
              <button onClick={() => setNewApp({ ...newApp, open: !newApp.open })} className="btn-primary">
                <FiPlus /> Add one of our apps
              </button>
            </div>

            {newApp.open && (
              <div style={card}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input placeholder="Our application's name (e.g. Djarabi)" value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
                  <input
                    placeholder="Webhook URL (https://..., optional)"
                    value={newApp.webhook}
                    onChange={(e) => setNewApp({ ...newApp, webhook: e.target.value })}
                    style={{ flex: 2, minWidth: 220 }}
                  />
                  <button onClick={createApp} className="btn-primary" disabled={loading || !newApp.name.trim()}>
                    <FiCheck /> Create
                  </button>
                  <button onClick={() => setNewApp({ open: false, name: "", webhook: "" })}>
                    <FiX /> Cancel
                  </button>
                </div>
              </div>
            )}

            {apps.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6a7284" }}>
                <FiKey size={40} />
                <p>None of our applications uses IDITECHS Pay yet. Add one to get its API key.</p>
              </div>
            ) : (
              apps.map((a) => (
                <div key={a.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 16 }}>{a.name}</strong>
                      <span style={chip(a.active ? "#22c55e" : "#ef4444")}>{a.active ? "active" : "blocked"}</span>
                      <span style={{ color: "#6a7284", fontSize: 12 }}>{a._count.payments} payments</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => rotate(a, "api_key")} title="Replace the API key">
                        <FiKey /> New key
                      </button>
                      <button onClick={() => rotate(a, "webhook_secret")} title="Replace the webhook secret">
                        <FiLock /> New secret
                      </button>
                      <button
                        onClick={() => (!a.active || confirm(`Block ${a.name}? Its key stops working immediately.`)) && patchApp(a, { active: !a.active })}
                        className={a.active ? "btn-danger" : "btn-primary"}
                      >
                        {a.active ? "Block" : "Unblock"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "#9aa3b5" }}>
                    <span>
                      ID <code className="mono">{a.id}</code>
                    </span>
                    <span>
                      Key <code className="mono">{a.apiKeyPrefix}…</code>
                    </span>
                    <span>Since {new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
                    <span style={{ color: "#9aa3b5" }}>Webhook:</span>
                    {editHook?.id === a.id ? (
                      <>
                        <input value={editHook.url} onChange={(e) => setEditHook({ id: a.id, url: e.target.value })} placeholder="https://... (empty = none)" style={{ flex: 1, minWidth: 220 }} />
                        <button onClick={() => patchApp(a, { webhook_url: editHook.url.trim() || null })} className="btn-primary">
                          <FiCheck /> Save
                        </button>
                        <button onClick={() => setEditHook(null)}>
                          <FiX />
                        </button>
                      </>
                    ) : (
                      <>
                        <code className="mono" style={{ wordBreak: "break-all" }}>{a.webhookUrl ?? "none (the app must poll)"}</code>
                        <button onClick={() => setEditHook({ id: a.id, url: a.webhookUrl ?? "" })} style={{ height: 28 }}>Edit</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ---------------- Notifications ---------------- */}
        {tab === "notifications" && (
          <>
            <p style={{ color: "#9aa3b5", fontSize: 13, marginTop: 0 }}>
              Messages to apps that have not been delivered yet. They are retried automatically for about 3 days (at most once an hour after the first hour), and you get a WhatsApp alert after an hour of failures and when one gives up.
            </p>
            {deliveries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6a7284" }}>
                <FiCheck size={40} color="#22c55e" />
                <p>Every app has been notified.</p>
              </div>
            ) : (
              deliveries.map((d) => <DeliveryRow key={d.id} d={d} max={maxAttempts} onRetry={() => retry(d)} onOpen={() => openPayment(d.payment_id)} busy={loading} />)
            )}
          </>
        )}
      </div>

      {/* Payment detail */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "flex-end", zIndex: 10 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", height: "100%", overflowY: "auto", background: "#0d1220", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{money(detail.payment.amount, detail.payment.currency)}</h2>
              <button onClick={() => setDetail(null)} className="icon-btn">
                <FiX />
              </button>
            </div>
            <span style={chip(STATUS_COLORS[detail.payment.status] ?? "#666")}>{detail.payment.status}</span>
            <MoneyBackChip p={detail.payment} />
            <div style={{ ...card, marginTop: 16, fontSize: 13 }}>
              {[
                ["Payment id", detail.payment.id],
                ["App", detail.payment.app_name ?? detail.payment.app_id],
                ["Reference", detail.payment.reference],
                ["Description", detail.payment.description || "-"],
                ["Method", providers.find((x) => x.id === detail.payment.provider)?.label ?? detail.payment.provider],
                ["Provider ref", detail.payment.provider_ref ?? "-"],
                ["Refunded", detail.payment.amount_refunded ? money(detail.payment.amount_refunded, detail.payment.currency) : "-"],
                ["Card dispute", detail.payment.dispute ? `${detail.payment.dispute.status} (${money(detail.payment.dispute.amount, detail.payment.currency)})` : "-"],
                ["Customer", Object.values(detail.payment.customer ?? {}).join(", ") || "-"],
                ["Created", when(detail.payment.created_at)],
                ["Finished", when(detail.payment.completed_at)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
                  <span style={{ color: "#9aa3b5" }}>{k}</span>
                  <span style={{ textAlign: "right", wordBreak: "break-all", fontFamily: k.includes("id") || k.includes("ref") ? "ui-monospace, monospace" : undefined }}>{v}</span>
                </div>
              ))}
              {detail.payment.checkout_url && (
                <div style={{ marginTop: 8 }}>
                  <a href={detail.payment.checkout_url} target="_blank" rel="noreferrer">Open the payment page</a>
                </div>
              )}
            </div>

            <h3 style={h2}>History</h3>
            {detail.events.map((e) => (
              <details key={e.id} style={{ ...card, padding: "10px 14px", fontSize: 13 }}>
                <summary style={{ cursor: "pointer" }}>
                  <span style={{ color: "#9aa3b5" }}>{when(e.created_at)}</span> · <strong>{e.type}</strong> <span style={{ color: "#6a7284" }}>({e.source})</span>
                </summary>
                <pre className="mono" style={{ fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#9aa3b5", margin: "8px 0 0" }}>
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              </details>
            ))}

            <h3 style={h2}>Notifications to the app</h3>
            {detail.deliveries.length === 0 ? (
              <p style={{ color: "#6a7284", fontSize: 13 }}>None sent (the payment has not finished, or the app has no webhook).</p>
            ) : (
              detail.deliveries.map((d) => <DeliveryRow key={d.id} d={d} max={maxAttempts} onRetry={() => retry(d)} busy={loading} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Shown when money went back to the buyer after a success: a refund, or a card dispute (chargeback)
function MoneyBackChip({ p }: { p: Pick<Payment, "amount_refunded" | "dispute" | "currency"> }) {
  if (p.dispute) {
    const color = p.dispute.status === "won" || p.dispute.status === "warning_closed" ? "#22c55e" : "#a855f7";
    return <span style={{ ...chip(color), marginLeft: 6 }}>dispute: {p.dispute.status}</span>;
  }
  if (p.amount_refunded > 0) return <span style={{ ...chip("#a855f7"), marginLeft: 6 }}>refunded {money(p.amount_refunded, p.currency)}</span>;
  return null;
}

function DeliveryRow({ d, max, onRetry, onOpen, busy }: { d: Delivery; max: number; onRetry: () => void; onOpen?: () => void; busy: boolean }) {
  const gaveUp = !d.delivered_at && d.attempts >= max;
  const color = d.delivered_at ? "#22c55e" : gaveUp ? "#ef4444" : d.attempts > 0 ? "#f59e0b" : "#4da6ff";
  const label = d.delivered_at ? "delivered" : gaveUp ? "gave up" : d.attempts > 0 ? "retrying" : "sending";
  return (
    <div style={{ ...card, fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={chip(color)}>{label}</span>
          <strong>{d.event_type}</strong>
          <span style={{ color: "#9aa3b5" }}>to {d.app_name ?? d.app_id}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {onOpen && (
            <button onClick={onOpen} style={{ height: 30 }}>
              Payment
            </button>
          )}
          {!d.delivered_at && (
            <button onClick={onRetry} disabled={busy} className="btn-primary" style={{ height: 30 }}>
              <FiSend /> Retry now
            </button>
          )}
        </div>
      </div>
      <div style={{ color: "#9aa3b5", marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span>Attempts {d.attempts}/{max}</span>
        {d.last_error && <span style={{ color: "#fca5a5" }}>Last error: {d.last_error}</span>}
        {d.delivered_at ? <span>Delivered {when(d.delivered_at)}</span> : !gaveUp && d.attempts > 0 && <span>Next try {when(d.next_attempt_at)}</span>}
        <code className="mono" style={{ wordBreak: "break-all" }}>{d.webhook_url ?? "no webhook URL"}</code>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.024)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 600, margin: "8px 0 12px", color: "#eef1f7" };
const td: React.CSSProperties = { padding: "10px 12px", whiteSpace: "nowrap" };
function chip(color: string): React.CSSProperties {
  return { background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600 };
}

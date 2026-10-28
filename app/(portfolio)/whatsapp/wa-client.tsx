"use client";

import { useCallback, useState } from "react";
import {
  FiPlus, FiTrash2, FiRefreshCw, FiSmartphone, FiWifi, FiWifiOff,
  FiLink, FiTag, FiCheck, FiX, FiCopy, FiLogOut,
} from "react-icons/fi";
import { signOut } from "next-auth/react";

type Instance = {
  id: string;
  instanceId: string;
  name: string;
  phoneNumber: string | null;
  apps: string[];
  channel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const APPS = ["yorognini", "djarabbi", "filmu", "iditechs"];

const STATUS_COLORS: Record<string, string> = {
  connected: "#22c55e",
  created: "#a855f7",
  connecting: "#f59e0b",
  pairing: "#f59e0b",
  disconnected: "#ef4444",
};

export function WaClient({ initialInstances }: { initialInstances: Instance[] }) {
  const [instances, setInstances] = useState<Instance[]>(initialInstances);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createChannel, setCreateChannel] = useState("baileys");
  const [showCreate, setShowCreate] = useState(false);
  const [pairPhone, setPairPhone] = useState<Record<string, string>>({});
  const [qrData, setQrData] = useState<Record<string, string>>({});
  const [pairCode, setPairCode] = useState<Record<string, string>>({});
  const [assigningApp, setAssigningApp] = useState<string | null>(null);

  const api = useCallback(async (body: Record<string, unknown>) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp");
      const data = await res.json();
      if (data.ok) setInstances(data.instances);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    const data = await api({ action: "create", name: createName.trim(), channel: createChannel });
    if (data) {
      setCreateName("");
      setShowCreate(false);
      await refresh();
    }
  };

  const handleConnect = async (inst: Instance) => {
    await api({ action: "connect", id: inst.id });
    await refresh();
  };

  const handleDisconnect = async (inst: Instance) => {
    await api({ action: "disconnect", id: inst.id });
    await refresh();
  };

  const handleDelete = async (inst: Instance) => {
    if (!confirm(`Delete instance "${inst.name}"? This is permanent.`)) return;
    await api({ action: "delete", id: inst.id });
    await refresh();
  };

  const handleRestart = async (inst: Instance) => {
    await api({ action: "restart", id: inst.id });
    await refresh();
  };

  const handleQr = async (inst: Instance) => {
    const data = await api({ action: "qr", id: inst.id });
    if (data?.result) {
      const r = data.result as Record<string, unknown>;
      const qr = (r.qrCode ?? r.qr ?? r.base64 ?? r.code ?? JSON.stringify(r)) as string;
      setQrData((prev) => ({ ...prev, [inst.id]: qr }));
    }
  };

  const handlePair = async (inst: Instance) => {
    const phone = pairPhone[inst.id];
    if (!phone?.trim()) return;
    const data = await api({ action: "pair", id: inst.id, phoneNumber: phone.replace(/\D/g, "") });
    if (data?.result) {
      const r = data.result as Record<string, unknown>;
      const code = (r.pairingCode ?? r.code ?? JSON.stringify(r)) as string;
      setPairCode((prev) => ({ ...prev, [inst.id]: code }));
      await refresh();
    }
  };

  const handleToggleApp = async (inst: Instance, app: string) => {
    const current = inst.apps ?? [];
    const next = current.includes(app) ? current.filter((a) => a !== app) : [...current, app];
    await api({ action: "assign", id: inst.id, apps: next });
    await refresh();
  };

  const handleClearApps = async (inst: Instance) => {
    await api({ action: "assign", id: inst.id, apps: [] });
    setAssigningApp(null);
    await refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e5e5e5", padding: "24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FiSmartphone size={28} color="#22c55e" />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>WhatsApp Instances</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={refresh} disabled={loading} style={btnStyle("#333")}>
              <FiRefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
            </button>
            <button onClick={() => setShowCreate(!showCreate)} style={btnStyle("#22c55e", "#000")}>
              <FiPlus size={16} /> New Instance
            </button>
            <button onClick={() => signOut()} style={btnStyle("#333")}>
              <FiLogOut size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#2d1111", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#fca5a5" }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: "right", background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>
              <FiX />
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div style={{ background: "#111118", border: "1px solid #2a2a35", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Create New Instance</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                placeholder="Instance name (e.g. yorognini-prod)"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                style={inputStyle}
              />
              <select value={createChannel} onChange={(e) => setCreateChannel(e.target.value)} style={{ ...inputStyle, width: 140 }}>
                <option value="baileys">Baileys</option>
                <option value="cloud">Cloud API</option>
              </select>
              <button onClick={handleCreate} disabled={loading || !createName.trim()} style={btnStyle("#22c55e", "#000")}>
                <FiCheck size={16} /> Create
              </button>
              <button onClick={() => setShowCreate(false)} style={btnStyle("#333")}>
                <FiX size={16} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Instance List */}
        {instances.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
            <FiSmartphone size={48} style={{ marginBottom: 16 }} />
            <p>No WhatsApp instances yet.</p>
            <p style={{ fontSize: 14 }}>Create one to connect a phone number for your apps.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {instances.map((inst) => (
              <div key={inst.id} style={{ background: "#111118", border: "1px solid #2a2a35", borderRadius: 12, padding: 20 }}>
                {/* Instance Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FiSmartphone size={20} color={STATUS_COLORS[inst.status] ?? "#666"} />
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{inst.name}</span>
                    <span style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${STATUS_COLORS[inst.status] ?? "#666"}22`,
                      color: STATUS_COLORS[inst.status] ?? "#666",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {inst.status}
                    </span>
                    <span style={{ fontSize: 12, color: "#555" }}>{inst.channel}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {inst.status !== "connected" && (
                      <button onClick={() => handleConnect(inst)} style={btnStyleSm("#22c55e")} title="Connect">
                        <FiWifi size={14} />
                      </button>
                    )}
                    {inst.status === "connected" && (
                      <button onClick={() => handleDisconnect(inst)} style={btnStyleSm("#f59e0b")} title="Disconnect">
                        <FiWifiOff size={14} />
                      </button>
                    )}
                    <button onClick={() => handleRestart(inst)} style={btnStyleSm("#3b82f6")} title="Restart">
                      <FiRefreshCw size={14} />
                    </button>
                    <button onClick={() => handleDelete(inst)} style={btnStyleSm("#ef4444")} title="Delete">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Info Row */}
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#888", marginBottom: 12 }}>
                  <span><strong style={{ color: "#aaa" }}>ID:</strong> {inst.instanceId}</span>
                  {inst.phoneNumber && <span><strong style={{ color: "#aaa" }}>Phone:</strong> +{inst.phoneNumber}</span>}
                  {inst.apps?.length > 0 && (
                    <span>
                      <FiTag size={12} style={{ verticalAlign: -1 }} />{" "}
                      <strong style={{ color: "#aaa" }}>Apps:</strong>{" "}
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>{inst.apps.join(", ")}</span>
                    </span>
                  )}
                  <span>Created {new Date(inst.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => handleQr(inst)} style={btnStyle("#1e293b")} disabled={loading}>
                    <FiLink size={14} /> QR Code
                  </button>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input
                      placeholder="Phone (e.g. 22377374782)"
                      value={pairPhone[inst.id] ?? ""}
                      onChange={(e) => setPairPhone((p) => ({ ...p, [inst.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handlePair(inst)}
                      style={{ ...inputStyle, width: 200, height: 34, fontSize: 13 }}
                    />
                    <button onClick={() => handlePair(inst)} style={btnStyle("#1e293b")} disabled={loading || !pairPhone[inst.id]?.trim()}>
                      Pair
                    </button>
                  </div>
                  {/* App assignment — toggle chips, multiple apps per instance */}
                  {assigningApp === inst.id ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                      {APPS.map((a) => {
                        const active = (inst.apps ?? []).includes(a);
                        return (
                          <button key={a} onClick={() => handleToggleApp(inst, a)} style={btnStyle(active ? "#22c55e" : "#1e293b", active ? "#000" : undefined)}>
                            {active && <FiCheck size={12} />} {a}
                          </button>
                        );
                      })}
                      {(inst.apps ?? []).length > 0 && (
                        <button onClick={() => handleClearApps(inst)} style={btnStyle("#7f1d1d")}>Clear all</button>
                      )}
                      <button onClick={() => setAssigningApp(null)} style={btnStyle("#333")}><FiX size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningApp(inst.id)} style={btnStyle("#1e293b")}>
                      <FiTag size={14} /> {(inst.apps ?? []).length > 0 ? `Apps: ${inst.apps.join(", ")}` : "Assign Apps"}
                    </button>
                  )}
                </div>

                {/* QR Code Display */}
                {qrData[inst.id] && (
                  <div style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 8, display: "inline-block" }}>
                    {qrData[inst.id].startsWith("data:") || qrData[inst.id].startsWith("http") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrData[inst.id]} alt="QR Code" style={{ maxWidth: 256 }} />
                    ) : (
                      <pre style={{ color: "#000", fontSize: 10, lineHeight: 1.1, margin: 0, whiteSpace: "pre" }}>{qrData[inst.id]}</pre>
                    )}
                    <button onClick={() => setQrData((p) => { const n = { ...p }; delete n[inst.id]; return n; })} style={{ display: "block", margin: "8px auto 0", ...btnStyleSm("#333") }}>
                      Close
                    </button>
                  </div>
                )}

                {/* Pairing Code Display */}
                {pairCode[inst.id] && (
                  <div style={{ marginTop: 12, padding: "12px 16px", background: "#1a1a2e", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>Pairing code:</span>
                    <code style={{ fontSize: 20, fontWeight: 700, color: "#22c55e", letterSpacing: "0.15em" }}>{pairCode[inst.id]}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(pairCode[inst.id])}
                      style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const btnStyle = (bg: string, color?: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 8, border: "none",
  background: bg, color: color ?? "#e5e5e5", cursor: "pointer",
  fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
});

const btnStyleSm = (color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: 8, border: "none",
  background: `${color}22`, color, cursor: "pointer",
});

const inputStyle: React.CSSProperties = {
  background: "#1a1a25", border: "1px solid #2a2a35", borderRadius: 8,
  padding: "8px 12px", color: "#e5e5e5", fontSize: 14, outline: "none",
  flex: 1, minWidth: 200,
};

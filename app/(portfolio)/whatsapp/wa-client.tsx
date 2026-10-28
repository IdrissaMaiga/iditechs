"use client";

import { useCallback, useRef, useState } from "react";
import {
  FiPlus, FiTrash2, FiRefreshCw, FiSmartphone, FiWifi, FiWifiOff,
  FiLink, FiCheck, FiX, FiCopy, FiLogOut, FiGlobe,
} from "react-icons/fi";
import { signOut } from "next-auth/react";

type Instance = {
  id: string;
  instanceId: string;
  name: string;
  phoneNumber: string | null;
  tags: string[];
  channel: string;
  status: string;
  webhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_URL = "https://wa.projexel.eu";

const STATUS_COLORS: Record<string, string> = {
  connected: "#22c55e",
  open: "#22c55e",
  created: "#a855f7",
  connecting: "#f59e0b",
  pairing: "#f59e0b",
  disconnected: "#ef4444",
  closed: "#ef4444",
};

function copied(text: string) {
  navigator.clipboard.writeText(text);
}

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
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [webhookInput, setWebhookInput] = useState<Record<string, string>>({});
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const busyRef = useRef(false);

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

  const handleRefreshStatus = async (inst: Instance) => {
    await api({ action: "refresh-status", id: inst.id });
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

  const handleAddTag = async (inst: Instance) => {
    const t = tagInput.trim().toLowerCase();
    if (!t || (inst.tags ?? []).includes(t)) { setTagInput(""); return; }
    if (busyRef.current) return;
    busyRef.current = true;
    const next = [...(inst.tags ?? []), t];
    setInstances((prev) => prev.map((i) => (i.id === inst.id ? { ...i, tags: next } : i)));
    setTagInput("");
    await api({ action: "tags", id: inst.id, tags: next });
    await refresh();
    busyRef.current = false;
  };

  const handleRemoveTag = async (inst: Instance, tag: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const next = (inst.tags ?? []).filter((t) => t !== tag);
    setInstances((prev) => prev.map((i) => (i.id === inst.id ? { ...i, tags: next } : i)));
    await api({ action: "tags", id: inst.id, tags: next });
    await refresh();
    busyRef.current = false;
  };

  const handleSaveWebhook = async (inst: Instance) => {
    const url = webhookInput[inst.id]?.trim() || null;
    await api({ action: "webhook", id: inst.id, webhookUrl: url });
    setEditingWebhook(null);
    await refresh();
  };

  const copyField = (key: string, value: string) => {
    copied(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
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
                placeholder="Instance name (e.g. support-bot, notifications)"
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
            <p style={{ fontSize: 14 }}>Create one to connect a phone number. Any app, API, or MCP server can use it.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {instances.map((inst) => (
              <div key={inst.id} style={{ background: "#111118", border: "1px solid #2a2a35", borderRadius: 12, padding: 20 }}>
                {/* Instance Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <FiSmartphone size={20} color={STATUS_COLORS[inst.status] ?? "#666"} />
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{inst.name}</span>
                    <button
                      onClick={() => handleRefreshStatus(inst)}
                      style={{ ...chipStyle(STATUS_COLORS[inst.status] ?? "#666"), cursor: "pointer", border: "none" }}
                      title="Click to refresh status"
                    >
                      {inst.status}
                    </button>
                    <span style={{ fontSize: 12, color: "#555" }}>{inst.channel}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {inst.status !== "connected" && inst.status !== "open" && (
                      <button onClick={() => handleConnect(inst)} style={btnStyleSm("#22c55e")} title="Connect">
                        <FiWifi size={14} />
                      </button>
                    )}
                    {(inst.status === "connected" || inst.status === "open") && (
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
                  <span>
                    <strong style={{ color: "#aaa" }}>ID:</strong> {inst.instanceId}
                    <button onClick={() => copyField(`id-${inst.id}`, inst.instanceId)} style={copyBtn}>
                      {copiedField === `id-${inst.id}` ? <FiCheck size={11} color="#22c55e" /> : <FiCopy size={11} />}
                    </button>
                  </span>
                  {inst.phoneNumber && <span><strong style={{ color: "#aaa" }}>Phone:</strong> +{inst.phoneNumber}</span>}
                  {inst.webhookUrl && (
                    <span>
                      <FiGlobe size={12} style={{ verticalAlign: -1 }} />{" "}
                      <span style={{ color: "#3b82f6" }}>{inst.webhookUrl}</span>
                    </span>
                  )}
                  <span>Created {new Date(inst.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
                  {(inst.tags ?? []).map((tag) => (
                    <span key={tag} style={{ ...chipStyle("#3b82f6"), display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {tag}
                      <button onClick={() => handleRemoveTag(inst, tag)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0, lineHeight: 1 }}>
                        <FiX size={10} />
                      </button>
                    </span>
                  ))}
                  {editingTags === inst.id ? (
                    <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                      <input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(inst); if (e.key === "Escape") setEditingTags(null); }}
                        autoFocus
                        style={{ ...inputStyle, width: 140, height: 28, fontSize: 12, minWidth: 100, padding: "4px 8px" }}
                      />
                      <button onClick={() => handleAddTag(inst)} disabled={!tagInput.trim()} style={btnStyleSm("#22c55e")} title="Add">
                        <FiCheck size={12} />
                      </button>
                      <button onClick={() => { setEditingTags(null); setTagInput(""); }} style={btnStyleSm("#666")} title="Done">
                        <FiX size={12} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingTags(inst.id)} style={{ ...chipStyle("#555"), cursor: "pointer", border: "none" }}>
                      <FiPlus size={10} style={{ verticalAlign: -1 }} /> tag
                    </button>
                  )}
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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

                  {/* Webhook URL */}
                  {editingWebhook === inst.id ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        placeholder="https://your-service.com/webhook"
                        value={webhookInput[inst.id] ?? ""}
                        onChange={(e) => setWebhookInput((p) => ({ ...p, [inst.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveWebhook(inst)}
                        style={{ ...inputStyle, width: 280, height: 34, fontSize: 13 }}
                      />
                      <button onClick={() => handleSaveWebhook(inst)} style={btnStyle("#22c55e", "#000")}><FiCheck size={14} /></button>
                      <button onClick={() => setEditingWebhook(null)} style={btnStyle("#333")}><FiX size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingWebhook(inst.id); setWebhookInput((p) => ({ ...p, [inst.id]: inst.webhookUrl ?? "" })); }} style={btnStyle("#1e293b")}>
                      <FiGlobe size={14} /> {inst.webhookUrl ? "Edit Webhook" : "Set Webhook"}
                    </button>
                  )}

                  {/* Integration config */}
                  <button onClick={() => setShowConfig(showConfig === inst.id ? null : inst.id)} style={btnStyle("#1e293b")}>
                    <FiCopy size={14} /> Config
                  </button>
                </div>

                {/* Integration Config Panel */}
                {showConfig === inst.id && (
                  <div style={{ marginTop: 12, padding: 16, background: "#0d0d18", borderRadius: 8, border: "1px solid #2a2a35" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#aaa" }}>Integration Config</div>
                    <p style={{ fontSize: 12, color: "#555", margin: "0 0 12px" }}>
                      Use these values in any app, API client, or MCP server to interact with this WhatsApp number.
                    </p>
                    {[
                      ["API URL", API_URL],
                      ["Instance ID", inst.instanceId],
                      ["Phone", inst.phoneNumber ? `+${inst.phoneNumber}` : "(not paired)"],
                      ["Webhook", inst.webhookUrl ?? "(not set)"],
                      ["Tags", (inst.tags ?? []).join(", ") || "(none)"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: "#666", width: 90, flexShrink: 0 }}>{label}:</span>
                        <code style={{ color: "#e5e5e5", flex: 1, wordBreak: "break-all" }}>{val}</code>
                        {val && !val.startsWith("(") && (
                          <button onClick={() => copyField(`cfg-${inst.id}-${label}`, val)} style={copyBtn}>
                            {copiedField === `cfg-${inst.id}-${label}` ? <FiCheck size={11} color="#22c55e" /> : <FiCopy size={11} />}
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          const cfg = JSON.stringify({ apiUrl: API_URL, instanceId: inst.instanceId, phoneNumber: inst.phoneNumber, webhookUrl: inst.webhookUrl, tags: inst.tags }, null, 2);
                          copyField(`cfg-json-${inst.id}`, cfg);
                        }}
                        style={btnStyle("#1e293b")}
                      >
                        <FiCopy size={14} /> Copy JSON
                      </button>
                      <button
                        onClick={() => {
                          const curl = `curl -X POST ${API_URL}/message/sendText/${inst.instanceId} \\\n  -H "Content-Type: application/json" \\\n  -H "apikey: YOUR_API_KEY" \\\n  -d '{"number":"5511999999999","text":"Hello!"}'`;
                          copyField(`cfg-curl-${inst.id}`, curl);
                        }}
                        style={btnStyle("#1e293b")}
                      >
                        <FiCopy size={14} /> Copy cURL example
                      </button>
                    </div>
                  </div>
                )}

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
                    <button onClick={() => copied(pairCode[inst.id])} style={copyBtn}>
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

const chipStyle = (color: string): React.CSSProperties => ({
  fontSize: 11, padding: "2px 8px", borderRadius: 20,
  background: `${color}22`, color, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
});

const copyBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#666",
  cursor: "pointer", padding: 2, marginLeft: 4, verticalAlign: "middle",
};

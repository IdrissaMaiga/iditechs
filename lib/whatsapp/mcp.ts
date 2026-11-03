const WA_MCP_URL = "https://wa.iditechs.com/mcp";
const WA_MCP_TOKEN = process.env.WA_MCP_TOKEN || "";

export const WA_API_URL = WA_MCP_URL.replace("/mcp", "");

function parseSSE(body: string): Record<string, unknown> {
  for (const line of body.split("\n")) {
    if (line.startsWith("data:")) {
      try {
        return JSON.parse(line.slice(5).trim());
      } catch {}
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

class WaMcp {
  private sid: string | null = null;

  private async post(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${WA_MCP_TOKEN}`,
    };
    if (this.sid) headers["Mcp-Session-Id"] = this.sid;

    const res = await fetch(WA_MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    if (!this.sid) {
      this.sid = res.headers.get("mcp-session-id");
    }
    const text = await res.text();
    if (!res.ok) {
      console.error("[mcp]", res.status, text.slice(0, 500));
      return { error: { code: res.status, body: text.slice(0, 800) } };
    }
    return parseSSE(text);
  }

  async init(): Promise<void> {
    const r = await this.post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "iditechs-wa", version: "1" },
      },
    });
    if (!r.result) throw new Error(`WhatsApp server handshake failed: ${JSON.stringify(r.error ?? r).slice(0, 300)}`);
    await this.post({ jsonrpc: "2.0", method: "notifications/initialized" });
  }

  async call(tool: string, args: Record<string, unknown>): Promise<unknown> {
    const d = await this.post({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: tool, arguments: args },
    });
    if ("error" in d && !("result" in d)) throw new Error(JSON.stringify(d.error));
    const result = d.result as Record<string, unknown> | undefined;
    const content = result?.content as Array<{ text?: string }> | undefined;
    // Tool failures arrive as a normal result with isError set, not as a JSON-RPC error.
    if (result?.isError) throw new Error(content?.[0]?.text || `${tool} failed`);
    if (content?.[0]?.text) {
      try {
        return JSON.parse(content[0].text);
      } catch {
        return content[0].text;
      }
    }
    return result ?? d;
  }

  /** Reads an MCP resource (read-only, no side effects) and parses its JSON text. */
  async read(uri: string): Promise<unknown> {
    const d = await this.post({ jsonrpc: "2.0", id: 4, method: "resources/read", params: { uri } });
    if ("error" in d && !("result" in d)) throw new Error(JSON.stringify(d.error));
    const contents = (d.result as { contents?: Array<{ text?: string }> } | undefined)?.contents;
    return JSON.parse(contents?.[0]?.text ?? "null");
  }
}

export type LiveInstance = { status: string; phoneNumber: string | null; lastConnected: string | number | null };

// A normal reconnect takes seconds; longer than this means the line is really down
const OFFLINE_AFTER_MS = 2 * 60 * 1000;

/**
 * Real state of every instance, straight from the WhatsApp server (whatsapp://instances).
 * "offline": connecting or disconnected for over 2 minutes since it was last connected (for example
 * WhatsApp removed the linked device). The server's phone number field is not used: it can be empty
 * on a healthy instance.
 */
export async function liveInstances(mcp: WaMcp): Promise<Map<string, LiveInstance>> {
  const list = (await mcp.read("whatsapp://instances")) as Array<{
    id: string;
    status: string;
    phoneNumber: string | null;
    lastConnected: string | number | null;
  }> | null;
  // A malformed answer must not read as "no instances" (that would mark every line gone)
  if (!Array.isArray(list)) throw new Error("whatsapp://instances returned no list");
  const map = new Map<string, LiveInstance>();
  for (const i of list) {
    // qr_pending is already the "scan me" state; keep it
    const last = i.lastConnected ? new Date(i.lastConnected).getTime() : 0;
    const down = (i.status === "connecting" || i.status === "disconnected") && Date.now() - last > OFFLINE_AFTER_MS;
    const status = down ? "offline" : i.status;
    map.set(i.id, { status, phoneNumber: i.phoneNumber, lastConnected: i.lastConnected });
  }
  return map;
}

export async function getMcp(): Promise<WaMcp> {
  const m = new WaMcp();
  await m.init();
  return m;
}

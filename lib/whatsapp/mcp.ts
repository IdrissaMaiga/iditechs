const WA_MCP_URL = "https://wa.projexel.eu/mcp";
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
    });
    if (!this.sid) {
      this.sid = res.headers.get("mcp-session-id");
    }
    const text = await res.text();
    if (!res.ok) return { error: { code: res.status, body: text.slice(0, 800) } };
    return parseSSE(text);
  }

  async init(): Promise<void> {
    await this.post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "iditechs-wa", version: "1" },
      },
    });
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
    if (content?.[0]?.text) {
      try {
        return JSON.parse(content[0].text);
      } catch {
        return content[0].text;
      }
    }
    return result ?? d;
  }
}

export async function getMcp(): Promise<WaMcp> {
  const m = new WaMcp();
  await m.init();
  return m;
}

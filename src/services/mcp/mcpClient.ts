import type { McpTool } from "../../types/mcp";

const PROTOCOL_VERSION = "2025-03-26";

export class McpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "McpError";
  }
}

export class McpClient {
  private url = "";
  private sessionId: string | null = null;

  async initialize(url: string): Promise<void> {
    this.url = url;
    this.sessionId = null;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "ai-chatroom", version: "1.0" },
        },
      }),
    });

    if (!response.ok) {
      throw new McpError(`MCP initialize failed: ${response.statusText}`, response.status);
    }

    const sessionHeader = response.headers.get("mcp-session-id");
    if (sessionHeader) this.sessionId = sessionHeader;

    await this.readResponse(response);

    // Required by the spec: client must send initialized notification before any other requests.
    const notifResponse = await fetch(this.url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      }),
    });

    if (!notifResponse.ok) {
      throw new McpError(`MCP initialized notification failed: ${notifResponse.statusText}`, notifResponse.status);
    }

    // 202 Accepted has no body — just drain it
    await notifResponse.text();
  }

  async listTools(): Promise<McpTool[]> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    if (!response.ok) {
      throw new McpError(`MCP tools/list failed: ${response.statusText}`, response.status);
    }

    const data = await this.readResponse(response) as {
      result?: { tools?: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> };
    };

    return (data.result?.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: t.inputSchema ?? {},
    }));
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ content: string; isError: boolean }> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name, arguments: args },
      }),
    });

    if (!response.ok) {
      throw new McpError(`MCP tools/call failed: ${response.statusText}`, response.status);
    }

    const data = await this.readResponse(response) as {
      result?: { content?: Array<{ type: string; text?: string }>; isError?: boolean };
    };
    const result = data.result ?? {};
    const isError = result.isError ?? false;
    const content = (result.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");

    return { content, isError };
  }

  // Reads a response that may be plain JSON or an SSE stream, returning the last parsed JSON object.
  private async readResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/event-stream")) {
      return response.json();
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let last: unknown = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            last = JSON.parse(line.slice(6));
          } catch {
            // skip malformed lines
          }
        }
      }
    }

    return last;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "MCP-Protocol-Version": PROTOCOL_VERSION,
    };
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;
    return headers;
  }
}

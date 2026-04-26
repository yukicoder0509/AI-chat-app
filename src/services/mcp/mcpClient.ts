import type { McpTool } from "../../types/mcp";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
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

    await response.json(); // consume body
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

    const data = (await response.json()) as {
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

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/event-stream")) {
      // SSE stream — read until done
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let isError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6)) as {
                result?: { content?: Array<{ type: string; text?: string }>; isError?: boolean };
              };
              const result = parsed.result;
              if (result) {
                isError = result.isError ?? false;
                text = (result.content ?? [])
                  .filter((c) => c.type === "text")
                  .map((c) => c.text ?? "")
                  .join("");
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }

      return { content: text, isError };
    }

    // Plain JSON response
    const data = (await response.json()) as {
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

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;
    return headers;
  }
}

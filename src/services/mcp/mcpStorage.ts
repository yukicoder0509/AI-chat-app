import type { McpServer } from "../../types/mcp";

const STORAGE_KEY = "ai-chatroom-mcp-servers";

export function loadServers(): McpServer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const servers = JSON.parse(raw) as McpServer[];
    // Reset transient fields on load
    return servers.map((s) => ({ ...s, status: "disconnected" as const, tools: [] }));
  } catch {
    return [];
  }
}

export function saveServers(servers: McpServer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
}

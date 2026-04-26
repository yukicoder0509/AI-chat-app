import { useState, useEffect, useCallback } from "react";
import { McpClient } from "../services/mcp/mcpClient";
import { loadServers, saveServers } from "../services/mcp/mcpStorage";
import type { McpServer, McpTool } from "../types/mcp";

function generateId(): string {
  return `srv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface UseToolsReturn {
  servers: McpServer[];
  availableTools: McpTool[];
  executeTool: (serverId: string, name: string, args: Record<string, unknown>) => Promise<string>;
  reconnect: (serverId: string) => Promise<void>;
  addServer: (server: Omit<McpServer, "id" | "status" | "tools">) => Promise<void>;
  updateServer: (id: string, updates: Partial<McpServer>) => void;
  removeServer: (id: string) => void;
}

export const useTools = (): UseToolsReturn => {
  const [servers, setServers] = useState<McpServer[]>(() => loadServers());
  const clients = useState<Map<string, McpClient>>(() => new Map())[0];

  const connectServer = useCallback(
    async (server: McpServer): Promise<McpServer> => {
      const client = new McpClient();
      clients.set(server.id, client);

      // Mark connecting
      setServers((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, status: "connecting" } : s)),
      );

      try {
        await client.initialize(server.url);
        const tools = await client.listTools();
        const withServerId = tools.map((t) => ({ ...t, serverId: server.id }));
        const connected: McpServer = {
          ...server,
          status: "connected",
          tools: withServerId,
          statusMessage: undefined,
        };
        return connected;
      } catch (err) {
        clients.delete(server.id);
        return {
          ...server,
          status: "error",
          tools: [],
          statusMessage: err instanceof Error ? err.message : "Connection failed",
        };
      }
    },
    [clients],
  );

  // Connect enabled servers on mount
  useEffect(() => {
    const enabledServers = servers.filter((s) => s.enabled);
    if (enabledServers.length === 0) return;

    Promise.all(enabledServers.map(connectServer)).then((results) => {
      setServers((prev) => {
        const map = new Map(results.map((r) => [r.id, r]));
        const updated = prev.map((s) => map.get(s.id) ?? s);
        saveServers(updated);
        return updated;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reconnect = useCallback(
    async (serverId: string) => {
      const server = servers.find((s) => s.id === serverId);
      if (!server) return;
      const updated = await connectServer(server);
      setServers((prev) => {
        const next = prev.map((s) => (s.id === serverId ? updated : s));
        saveServers(next);
        return next;
      });
    },
    [servers, connectServer],
  );

  const addServer = useCallback(
    async (serverData: Omit<McpServer, "id" | "status" | "tools">) => {
      const server: McpServer = {
        ...serverData,
        id: generateId(),
        status: "disconnected",
        tools: [],
      };
      const result = await connectServer(server);
      setServers((prev) => {
        const next = [...prev, result];
        saveServers(next);
        return next;
      });
    },
    [connectServer],
  );

  const updateServer = useCallback(
    (id: string, updates: Partial<McpServer>) => {
      setServers((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        saveServers(next);
        return next;
      });
    },
    [],
  );

  const removeServer = useCallback(
    (id: string) => {
      clients.delete(id);
      setServers((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveServers(next);
        return next;
      });
    },
    [clients],
  );

  const executeTool = useCallback(
    async (serverId: string, name: string, args: Record<string, unknown>): Promise<string> => {
      const client = clients.get(serverId);
      if (!client) throw new Error(`No client for server ${serverId}`);
      const { content, isError } = await client.callTool(name, args);
      if (isError) throw new Error(content || "Tool returned an error");
      return content;
    },
    [clients],
  );

  const availableTools: McpTool[] = servers
    .filter((s) => s.enabled && s.status === "connected")
    .flatMap((s) => s.tools);

  return { servers, availableTools, executeTool, reconnect, addServer, updateServer, removeServer };
};

export type McpConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId?: string;
}

export interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  status: McpConnectionStatus;
  statusMessage?: string;
  tools: McpTool[];
}

export type ToolCallStatus = "pending" | "running" | "complete" | "error";

export interface ToolCall {
  id: string;
  toolName: string;
  serverId: string;
  arguments: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

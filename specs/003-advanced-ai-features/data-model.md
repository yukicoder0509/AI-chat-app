# Data Model: Advanced AI Features

**Branch**: `003-advanced-ai-features` | **Date**: 2026-04-25

---

## Existing entities (extended)

### Message _(extended)_

```typescript
// src/types/chat.ts
interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;                     // plain text content (assistant/user text)
  timestamp: number;
  tokens?: number;
  // NEW
  attachments?: Attachment[];          // images attached to this message
  toolCalls?: ToolCall[];              // tool invocations in this assistant message
  toolCallId?: string;                 // set when role === "tool" (links result to call)
  routingDecision?: RoutingDecision;   // set when auto-routing fired for this message
}
```

### Conversation _(extended)_

```typescript
// src/types/chat.ts
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  totalTokens: number;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  // NEW
  enabledMcpServerIds?: string[];      // MCP servers active for this conversation
}
```

### UserSettings _(extended)_

```typescript
// src/types/settings.ts
interface UserSettings {
  selectedModel: string;   // any model ID from /v1/models, OR the special value "auto"
  systemPrompt: string;
  apiUrl: string;
  apiKey: string;
  apiConfig: ApiConfig;
  theme: "light" | "dark" | "auto";
  autoSave: boolean;
  // NEW
  memoryEnabled: boolean;              // global toggle for long-term memory
}
```

**Note on `selectedModel`**: The value `"auto"` is a reserved sentinel that activates auto-routing. Any other value is treated as a literal model ID passed to the API. Auto-routing is implicitly enabled or disabled solely by whether `selectedModel === "auto"` — no separate flag is needed.

---

## New entities

### Attachment

Represents an image attached to a user message.

```typescript
// src/types/attachments.ts
interface Attachment {
  id: string;
  messageId: string;
  type: "image";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileName: string;
  fileSizeBytes: number;               // must be ≤ 5_242_880 (5 MB)
  previewObjectUrl?: string;           // ephemeral; revoked after send
  base64DataUrl: string;               // stored in conversation history
}
```

**Validation rules**:
- `fileSizeBytes` ≤ 5 242 880 (5 MB) — enforced before encoding
- `mimeType` must be one of the three listed values
- `base64DataUrl` must match `^data:image/(jpeg|png|webp);base64,`

**State transitions**:
```
selected → previewing → encoding → attached → sent
                                             └→ cancelled (user removes before send)
```

---

### RoutingDecision

Records the auto-routing outcome for a specific message.

```typescript
// src/types/routing.ts
type TaskType = "vision" | "code" | "reasoning" | "general";

interface RoutingDecision {
  taskType: TaskType;
  selectedModel: string;
  wasOverridden: boolean;              // true if user changed model after routing
  overriddenModel?: string;           // the model the user chose instead
}
```

---

### ModelCapability

Inferred capability profile for a model, derived from its ID string.

```typescript
// src/types/routing.ts
interface ModelCapability {
  modelId: string;
  supportsVision: boolean;
  supportsCode: boolean;              // inferred from ID (e.g., "coder", "starcoder")
  supportsReasoning: boolean;         // inferred from known large-model patterns
}
```

---

### MemoryEntry

A single stored fact extracted from a conversation.

```typescript
// src/types/memory.ts
interface MemoryEntry {
  id: string;                         // uuid
  fact: string;                       // e.g., "User is building a Python service"
  sourceConversationId: string;
  createdAt: number;                  // timestamp
  updatedAt: number;                  // timestamp (set on user edit)
}
```

**Validation rules**:
- `fact` must be non-empty and ≤ 500 characters
- `sourceConversationId` must reference an existing conversation

**Storage**: Persisted in `localStorage` under key `"ai-chatroom-memories"` as a JSON array of `MemoryEntry[]`.

---

### McpServer

A user-configured MCP server connection.

```typescript
// src/types/mcp.ts
type McpConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

interface McpServer {
  id: string;                         // uuid
  name: string;                       // user-provided label
  url: string;                        // Streamable HTTP endpoint
  enabled: boolean;
  status: McpConnectionStatus;
  statusMessage?: string;             // error reason when status === "error"
  tools: McpTool[];                   // populated after successful connection
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;  // JSON Schema object
}
```

**Validation rules**:
- `url` must be a valid HTTP/HTTPS URL
- `name` must be non-empty
- `tools` is populated by the client after `tools/list` succeeds; empty until connected

**Storage**: Persisted in `localStorage` under key `"ai-chatroom-mcp-servers"` as a JSON array of `McpServer[]` (status reset to `"disconnected"` on load; tools cleared and re-fetched on reconnect).

---

### ToolCall

A record of a single tool invocation embedded in an assistant message.

```typescript
// src/types/mcp.ts
type ToolCallStatus = "pending" | "running" | "complete" | "error";

interface ToolCall {
  id: string;                         // matches OpenAI tool_call.id
  toolName: string;
  serverId: string;                   // which MCP server
  arguments: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;                    // stringified result content
  error?: string;                     // error message when status === "error"
  startedAt?: number;
  completedAt?: number;
}
```

---

## Storage layout

| Key | Type | Contents |
|-----|------|---------|
| `ai-chatroom-settings` | `UserSettings` (JSON) | Existing — extended with `memoryEnabled`; `selectedModel: "auto"` activates routing |
| `ai-chatroom-conversations` | `Conversation[]` (JSON) | Existing — Message extended with attachments, toolCalls, routingDecision |
| `ai-chatroom-memories` | `MemoryEntry[]` (JSON) | New |
| `ai-chatroom-mcp-servers` | `McpServer[]` (JSON) | New (status/tools cleared on load) |

---

## Entity relationships

```
UserSettings
 ├── selectedModel === "auto" → activates routing for every Message.routingDecision
 └── memoryEnabled → controls MemoryEntry creation/injection

Conversation
 └── messages: Message[]
      ├── attachments: Attachment[]        (user messages only)
      ├── toolCalls: ToolCall[]            (assistant messages only)
      │    └── serverId → McpServer.id
      └── routingDecision: RoutingDecision (user messages with auto-routing)

MemoryEntry
 └── sourceConversationId → Conversation.id

McpServer
 └── tools: McpTool[]
      └── inputSchema → maps to OpenAI function parameters
```

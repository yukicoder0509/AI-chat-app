# Developer Quickstart: Advanced AI Features

**Branch**: `003-advanced-ai-features`  
**Prerequisites**: spec 001 implemented and running

---

## What's being added

Four independent feature modules that extend the existing chat interface:

| Feature | New hook | New service | New component area |
|---------|----------|------------|-------------------|
| Multimodal | — | `imageProcessor` | `AttachmentPreview`, input bar update |
| Auto-routing | `useRouting` | `taskRouter` | Chat header indicator |
| Long-term memory | `useMemory` | `memoryStorage`, `memoryExtractor` | `MemoryPanel` |
| Tool use / MCP | `useTools` | `mcpClient` | `ToolCallBlock`, Settings MCP tab |

---

## Source layout (additions only)

```
src/
├── components/
│   ├── ChatInterface/
│   │   ├── AttachmentPreview/        image thumbnail + remove button in input area
│   │   └── ToolCallBlock/            collapsible inline tool result card
│   ├── Memory/
│   │   └── MemoryPanel/              modal for viewing/editing/deleting memories
│   └── Settings/
│       └── McpSettings/              MCP server list + add/test/toggle controls
├── hooks/
│   ├── useMemory.ts                  load, inject, extract, CRUD for memory entries
│   └── useTools.ts                  connect MCP servers, list tools, execute calls
├── services/
│   ├── memory/
│   │   ├── memoryExtractor.ts        LLM-based fact extraction (background call)
│   │   └── memoryStorage.ts          localStorage CRUD for MemoryEntry[]
│   ├── mcp/
│   │   └── mcpClient.ts              Streamable HTTP JSON-RPC client
│   ├── routing/
│   │   └── taskRouter.ts             keyword classifier + model capability registry
│   └── vision/
│       └── imageProcessor.ts         resize/compress → base64, MIME validation
└── types/
    ├── attachments.ts
    ├── memory.ts
    └── mcp.ts
```

---

## Implementation order (recommended)

The four features are independent. Build in this order to avoid rework:

### Phase 1 — Multimodal (no new storage, no new state)

1. Add `Attachment` type and extend `Message` in `src/types/`
2. Implement `imageProcessor.ts`: validate MIME + size, resize via Canvas API, encode to base64
3. Add `AttachmentPreview` component to the input bar
4. Update `OpenAIClient.streamChatCompletion` to accept `MessageContent` (string | array)
5. Update `useChat.sendMessage` to build the content array when attachments are present
6. Add vision detection helper to `taskRouter.ts` (used in Phase 2)

### Phase 2 — Auto-Routing (no new storage)

Auto-routing is activated solely by `selectedModel === "auto"` — there is no separate toggle.

1. Implement `taskRouter.ts`: `classifyTask(message)` → `TaskType`, `inferCapabilities(modelId)` → `ModelCapability`, `selectModel(taskType, models)` → `string`
2. Add `useRouting` hook: fires when `conversation.model === "auto"`, calls `classifyTask` + `selectModel`, returns the resolved model ID for each send
3. Prepend an "Auto" entry to the model list in `useModels.ts` so it appears first in every dropdown
4. Wire `useRouting` into `App.tsx` `handleSendMessage`; pass `routingDecision` to `ChatInterface`
5. Display routing decision badge in chat header (task type + chosen model), only when `conversation.model === "auto"`
6. Selecting any specific model from the dropdown writes that model ID (not "auto") — routing stops immediately

### Phase 3 — Long-Term Memory

1. Add `MemoryEntry` type and `memoryStorage.ts` (load/save/delete from localStorage)
2. Implement `memoryExtractor.ts`: fires a background LLM call after `finishStreaming`, parses JSON response, persists new entries
3. Add `useMemory` hook: loads entries, provides `injectMemories(systemPrompt)`, `extractFromConversation`, CRUD actions
4. Update `useChat.startNewConversation` to prepend memory block to system prompt when memory is enabled
5. Integrate extraction call in `useChat.sendMessage` (after `finishStreaming`)
6. Build `MemoryPanel` modal (list entries, edit inline, delete)
7. Add memory toggle + "Manage Memories" button to Settings → General tab

### Phase 4 — Tool Use & MCP

1. Add `McpServer`, `McpTool`, `ToolCall` types
2. Implement `mcpClient.ts`: `initialize`, `listTools`, `callTool` via Streamable HTTP
3. Add `mcpStorage.ts` (load/save `McpServer[]` from localStorage, clear `status`/`tools` on load)
4. Add `useTools` hook: connects servers on mount, exposes `availableTools`, `executeTool`
5. Update `OpenAIClient` and `streamChat` to accept `tools` array and handle `tool_calls` in streaming
6. Update `useChat.sendMessage` to intercept `finish_reason: "tool_calls"`, execute tools sequentially, then resume
7. Build `ToolCallBlock` component (pending/running/complete/error states, collapsible result)
8. Build `McpSettings` component (add server form, status badge, tool list, enable/disable toggle)
9. Wire `McpSettings` into Settings panel as a new tab

---

## Key integration points in existing code

| File | Change needed |
|------|--------------|
| `src/types/openai.ts` | `MessageContent = string \| ContentBlock[]`; add `tool_calls`, `tool_call_id` to message |
| `src/types/chat.ts` | Add `attachments`, `toolCalls`, `routingDecision` to `Message`; add `enabledMcpServerIds` to `Conversation` |
| `src/types/settings.ts` | Add `memoryEnabled` to `UserSettings` and `DEFAULT_USER_SETTINGS`; `"auto"` is already a valid `selectedModel` value — no new field needed |
| `src/services/openai/openaiClient.ts` | Accept content arrays; handle `tool_calls` in stream chunks |
| `src/services/openai/streamChat.ts` | Accept `tools` option; detect and return `tool_calls` via callback |
| `src/hooks/useChat.ts` | Call routing before send; call memory extraction after; handle tool call loop |
| `src/app/App.tsx` | Pass `useMemory`, `useTools`, `useRouting` results to child components |
| `src/components/Settings/SettingsPanel.tsx` | Add MCP tab; add memory toggle and manage button |
| `src/components/ChatInterface/InputBox.tsx` | Add attachment button and preview strip |
| `src/components/ChatInterface/ChatInterface.tsx` | Add routing badge; render `ToolCallBlock` within `MessageList` |

---

## Testing each feature in isolation

**Multimodal**: Attach a JPEG to a message. Confirm the content array is logged in devtools network tab with `type: "image_url"`.

**Auto-routing**: Enable auto-routing in Settings. Send a message starting with a code fence. Confirm the chat header shows "code" task type and a code-capable model (if one matches).

**Memory**: Send "My name is Alex and I work on Rust microservices." Wait ~2 seconds for extraction. Open memory panel — the fact should appear. Start a new conversation and ask "What do you know about me?" — the assistant should reference Alex and Rust.

**Tool use**: Add a local MCP server URL (e.g., `http://localhost:3001/mcp`). Navigate to Settings → MCP. The server should show as Connected with its tool list. Send a message that triggers a tool. Confirm the `ToolCallBlock` appears inline.

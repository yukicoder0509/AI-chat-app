# Tasks: Advanced AI Features — Memory, Multimodal, Auto-Routing, Tool Use & MCP

**Input**: Design documents from `/specs/003-advanced-ai-features/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Create new type and module stubs so TypeScript import resolution works across all stories before any implementation begins.

- [ ] T001 Create type stub files: `src/types/attachments.ts`, `src/types/memory.ts`, `src/types/mcp.ts`, `src/types/routing.ts` — each exports its interfaces as empty skeletons so downstream imports compile
- [ ] T002 [P] Create service module stubs: `src/services/vision/imageProcessor.ts`, `src/services/memory/memoryStorage.ts`, `src/services/memory/memoryExtractor.ts`, `src/services/mcp/mcpClient.ts`, `src/services/mcp/mcpStorage.ts`, `src/services/routing/taskRouter.ts` — each exports its functions/classes as `throw new Error("not implemented")` stubs
- [ ] T003 [P] Create hook stubs and register exports: `src/hooks/useMemory.ts`, `src/hooks/useTools.ts`, `src/hooks/useRouting.ts` — add all three to `src/hooks/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the three shared type files that every user story's implementation depends on. Must be complete before any story begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Extend `src/types/openai.ts` — add `TextContent` and `ImageContent` block types; change `MessageContent = string | Array<TextContent | ImageContent>`; add `tool_calls` array to `OpenAIStreamDelta`; add `tool_call_id?: string` and `"tool"` to the message role union
- [ ] T005 [P] Extend `Message` in `src/types/chat.ts` — add `attachments?: Attachment[]`, `toolCalls?: ToolCall[]`, `toolCallId?: string`, `routingDecision?: RoutingDecision`; add `enabledMcpServerIds?: string[]` to `Conversation`
- [ ] T006 [P] Extend `UserSettings` in `src/types/settings.ts` — add `memoryEnabled: boolean` (default `false`); add a comment noting that `selectedModel: "auto"` is the routing sentinel; update `DEFAULT_USER_SETTINGS`

**Checkpoint**: Type layer is consistent — user story implementation can begin.

---

## Phase 3: User Story 1 — Image Attachments & Vision Responses (Priority: P1) 🎯 MVP

**Goal**: Users can attach images to messages and receive vision-aware responses from compatible models.

**Independent Test**: Attach a JPEG to a message sent to a vision-capable model. Verify the network request body contains a content array with `type: "image_url"` and the assistant responds with observations about the image. Verify a warning appears when a non-vision model is selected.

### Implementation

- [ ] T007 [P] [US1] Implement `src/services/vision/imageProcessor.ts` — `validateImage(file: File): void` (throws on unsupported MIME or >5 MB); `resizeAndCompress(file: File): Promise<Blob>` (Canvas API, max 1920×1920, 80% JPEG quality); `encodeToBase64DataUrl(blob: Blob): Promise<string>`; `detectVisionCapability(modelId: string): boolean` (regex patterns: gpt-4o, gpt-4.*turbo, gpt-4.*vision, llava, moondream, qwen.*vl, minicpm-v)
- [ ] T008 [P] [US1] Update `src/services/openai/openaiClient.ts` — change message `content` type to `MessageContent` in `streamChatCompletion` and `createChatCompletion`; pass content array through unchanged if already an array
- [ ] T009 [US1] Build `src/components/ChatInterface/AttachmentPreview/` — component accepts `attachments: Attachment[]` and `onRemove: (id: string) => void`; renders thumbnails using `attachment.previewObjectUrl`; shows file name and remove (×) button per attachment; revokes Object URL after unmount
- [ ] T010 [US1] Update `src/components/ChatInterface/InputBox.tsx` — add attachment icon button that triggers a hidden `<input type="file" accept="image/jpeg,image/png,image/webp" multiple>`; render `<AttachmentPreview>` strip above the textarea; call `validateImage` on selection and show inline error on rejection; disable attachment button with tooltip when `detectVisionCapability(selectedModel)` is false
- [ ] T011 [US1] Update `src/hooks/useChat.ts` `sendMessage` — when `attachments` are present, call `resizeAndCompress` + `encodeToBase64DataUrl` per file, build a `MessageContent` array (`text` block + one `image_url` block per attachment), pass to `streamChat`; store `attachments` on the `Message` record; clear attachment state after send
- [ ] T012 [US1] Update `src/components/ChatInterface/MessageList.tsx` — for user messages with `attachments`, render `<img src={attachment.base64DataUrl}>` thumbnails (max-height: 200px) above the message text
- [ ] T013 [US1] Wire attachment state through `src/components/ChatInterface/ChatInterface.tsx` and `src/app/App.tsx` — add `attachments`, `onAttachmentsChange`, and `selectedModel` (for vision detection) as props/state; thread through to `InputBox` and `sendMessage`

**Checkpoint**: US1 fully functional — image attachments work end-to-end independently.

---

## Phase 4: User Story 2 — Auto Model Routing via "Auto" Selection (Priority: P1)

**Goal**: Selecting "Auto" in the model dropdown activates per-message task-based model routing. Selecting any specific model stops routing immediately.

**Independent Test**: Select "Auto" in the model dropdown. Send a message with a code block — verify the routing badge shows "code" task type and a code-matching model. Send a plain question — verify routing badge shows "general" and a different (or same) model. Select a specific model — verify the next message uses that model with no routing badge.

### Implementation

- [ ] T014 [P] [US2] Implement `src/services/routing/taskRouter.ts` — `classifyTask(message: string, hasAttachment: boolean): TaskType` (returns `"vision"` if attachment present; else matches code fence or keywords `function|debug|syntax|import|script|code` → `"code"`, analytical keywords `analyze|architecture|compare|tradeoff|design` → `"reasoning"`, default `"general"`); `inferCapabilities(modelId: string): ModelCapability` (uses same vision patterns from T007; adds code patterns: `coder|starcoder|deepseek-code`; reasoning patterns: `70b|72b|opus|gpt-4|claude-3`); `selectModel(taskType: TaskType, models: string[]): string` (returns first model matching the required capability; falls back to `models[0]`)
- [ ] T015 [US2] Implement `src/hooks/useRouting.ts` — `resolveModel(message: string, hasAttachment: boolean, availableModels: string[]): { modelId: string; decision: RoutingDecision }` — calls `classifyTask` then `selectModel`; returns the resolved model ID and a `RoutingDecision` object; no-ops and returns current model when called with `selectedModel !== "auto"`
- [ ] T016 [US2] Update `src/hooks/useModels.ts` — prepend `"auto"` to the start of the fetched models array; the "Auto" label is applied in the UI layer (ModelSelector)
- [ ] T017 [US2] Update `src/components/Settings/ModelSelector.tsx` — render the `"auto"` value as `"⚡ Auto"` as the first `<option>`; this special label must not be sent to the API as a model ID
- [ ] T018 [US2] Add routing decision badge to `src/components/ChatInterface/ChatInterface.tsx` header — visible only when `conversation.model === "auto"`; shows detected task type and chosen model name (e.g., "code → qwen-coder"); accepts `lastRoutingDecision: RoutingDecision | null` as prop; add `.routingBadge` style to `ChatInterface.module.css`
- [ ] T019 [US2] Wire `useRouting` into `src/app/App.tsx` `handleSendMessage` — call `resolveModel` when `conversation.model === "auto"` to get the actual model ID before calling `streamChat`; pass the resolved `RoutingDecision` to `updateConversationSettings` so it appears in the message; pass `lastRoutingDecision` to `ChatInterface`
- [ ] T020 [US2] Update `src/app/App.tsx` `handleModelChange` — when user selects `"auto"`, write `"auto"` to `conversation.model` (routing resumes); when user selects any other model, write that model ID (routing stops); ensure `"auto"` is never forwarded to `streamChat` as the `model` field

**Checkpoint**: US2 fully functional — "Auto" routes correctly, specific model selection overrides immediately.

---

## Phase 5: User Story 3 — Long-Term Memory Across Conversations (Priority: P2)

**Goal**: The system extracts memorable facts after each response and injects relevant memories at the start of new conversations.

**Independent Test**: In conversation A, state "My name is Alex and I work on Rust microservices." Wait ~2 s for background extraction. Open the memory panel and confirm the fact appears. Start a new conversation B, ask "What do you know about me?" — the assistant should reference Alex and Rust without being told again.

### Implementation

- [ ] T021 [P] [US3] Implement `src/services/memory/memoryStorage.ts` — `loadMemories(): MemoryEntry[]` (from localStorage key `"ai-chatroom-memories"`, returns `[]` on missing/corrupt); `saveMemory(entry: MemoryEntry): void`; `updateMemory(id: string, fact: string): void`; `deleteMemory(id: string): void`; `clearMemories(): void`
- [ ] T022 [P] [US3] Implement `src/services/memory/memoryExtractor.ts` — `extractFacts(lastExchange: Message[], credentials: {apiKey, apiUrl}, model: string): Promise<MemoryEntry[]>` — fires a non-streaming LLM call with a focused extraction system prompt (temperature 0.3, max_tokens 300) asking the model to return a JSON array of up to 5 discrete facts; parses the response; returns `[]` on any error (must never throw or block UI)
- [ ] T023 [US3] Implement `src/hooks/useMemory.ts` — loads memories from `memoryStorage` on mount; exposes `memories: MemoryEntry[]`, `injectMemories(systemPrompt: string): string` (prepends a "What you know about me:" block of ≤10 most recent facts, ~500 tokens max, only when `memoryEnabled` is true), `extractAndStore(conversationId, lastExchange, credentials, model): void` (calls `memoryExtractor.extractFacts` in background, persists new entries), `updateMemory`, `deleteMemory`, `clearMemories`; re-reads `memoryEnabled` from settings on each call
- [ ] T024 [US3] Update `src/hooks/useChat.ts` `startNewConversation` — call `useMemory.injectMemories(systemPrompt)` to prepend the memory block before creating the conversation; only when `settings.memoryEnabled` is true
- [ ] T025 [US3] Update `src/hooks/useChat.ts` `sendMessage` — after `finishStreaming()`, call `useMemory.extractAndStore` with the last two messages (the just-sent user message and the completed assistant response), current credentials, and current conversation model; call is fire-and-forget, does not await
- [ ] T026 [US3] Build `src/components/Memory/MemoryPanel/index.tsx` — modal overlay; lists all `MemoryEntry` items sorted by `createdAt` desc; each row: fact text (click to enter inline edit mode with save/cancel), creation date, delete (×) button; "Clear All" button with confirmation; empty state message when no memories; add `MemoryPanel.module.css`
- [ ] T027 [US3] Update `src/components/Settings/SettingsPanel.tsx` — add a `memoryEnabled` toggle switch to the General tab (calls `settings.updateSetting("memoryEnabled", value)`); add a "Manage Memories →" button below the toggle that calls `onOpenMemoryPanel` prop
- [ ] T028 [US3] Wire `useMemory` and `MemoryPanel` into `src/app/App.tsx` — add `showMemoryPanel` state; pass `onOpenMemoryPanel` to `SettingsPanel`; render `<MemoryPanel>` conditionally; pass `useMemory` actions to `useChat` (via hook composition or prop drilling)

**Checkpoint**: US3 fully functional — memory extraction, storage, injection, and management all work independently.

---

## Phase 6: User Story 4 — Tool Invocation via MCP During Responses (Priority: P2)

**Goal**: When MCP servers are configured and enabled, the assistant can invoke tools mid-response; tool calls and results are shown inline.

**Independent Test**: With a local MCP server running at `http://localhost:3001/mcp`, add it in Settings → MCP. Send a message that triggers a tool. Verify the `ToolCallBlock` appears in the chat with pending → running → complete states, and the assistant's final response incorporates the tool result.

### Implementation

- [ ] T029 [P] [US4] Implement `src/services/mcp/mcpClient.ts` — `McpClient` class with `initialize(url: string): Promise<void>` (sends `initialize` JSON-RPC POST, stores session ID from response header if present); `listTools(): Promise<McpTool[]>` (sends `tools/list` JSON-RPC, returns parsed tools array); `callTool(name: string, args: Record<string, unknown>): Promise<{content: string, isError: boolean}>` (sends `tools/call` JSON-RPC, reads response via `ReadableStream` for SSE or parses plain JSON, concatenates `content[*].text`); all methods throw `McpError` with status code on non-2xx responses
- [ ] T030 [P] [US4] Implement `src/services/mcp/mcpStorage.ts` — `loadServers(): McpServer[]` (from localStorage key `"ai-chatroom-mcp-servers"`; resets each server's `status` to `"disconnected"` and clears `tools` on load); `saveServers(servers: McpServer[]): void`
- [ ] T031 [US4] Implement `src/hooks/useTools.ts` — on mount loads servers via `mcpStorage.loadServers`; for each `enabled` server calls `mcpClient.initialize` + `listTools`, updates server `status` and `tools` in state; exposes `availableTools: McpTool[]` (flattened from all connected servers with `serverId` annotation), `executeTool(serverId, name, args): Promise<string>`, `servers`, `reconnect(serverId)`, `addServer`, `updateServer`, `removeServer` (all persist via `mcpStorage.saveServers`)
- [ ] T032 [US4] Update `src/services/openai/streamChat.ts` — accept optional `tools?: McpTool[]`; convert each `McpTool` to OpenAI function format (`{ type: "function", function: { name, description, parameters: inputSchema } }`); pass `tools` array and `tool_choice: "auto"` in request body when tools non-empty; add `onToolCalls?: (calls: ToolCall[]) => void` callback; detect `finish_reason: "tool_calls"` in stream; fire `onToolCalls` with parsed `tool_calls`; accept and send injected tool-result messages before resuming the stream
- [ ] T033 [US4] Update `src/hooks/useChat.ts` `sendMessage` — when `useTools.availableTools` is non-empty, pass tools to `streamChat`; add `onToolCalls` callback: (1) update the assistant message with pending `ToolCall` records, (2) call `useTools.executeTool` for each tool call sequentially, (3) update each `ToolCall` status to `running` then `complete`/`error`, (4) inject `tool` role messages into the conversation, (5) call `streamChat.resume` with the updated messages to get the final response
- [ ] T034 [P] [US4] Build `src/components/ChatInterface/ToolCallBlock/index.tsx` — accepts `toolCall: ToolCall` prop; renders a card with tool name and server label; `pending`: spinner + "Waiting…"; `running`: spinner + "Running…"; `complete`: collapsed by default, expand to show result text with a toggle button; `error`: error icon + error message; add `ToolCallBlock.module.css`
- [ ] T035 [US4] Update `src/components/ChatInterface/MessageList.tsx` — for assistant messages with `toolCalls`, render a `<ToolCallBlock>` for each entry between the preceding user message and the assistant's text response
- [ ] T036 [US4] Wire `useTools` into `src/app/App.tsx` — instantiate `useTools`; pass `availableTools` to `useChat` (add as a parameter or via a shared ref); pass `servers` count to `ChatInterface` for the tool badge
- [ ] T037 [US4] Add tool count badge to `src/components/ChatInterface/ChatInterface.tsx` header — shows "N tools" when `connectedServersCount > 0`; shows a muted "No tools" hint with link to settings when `connectedServersCount === 0` and user has previously added servers; add badge style to `ChatInterface.module.css`

**Checkpoint**: US4 fully functional — tools invoked and displayed inline when MCP servers are connected.

---

## Phase 7: User Story 5 — Configure MCP Server Connections (Priority: P3)

**Goal**: Users can add, test, enable/disable, and remove MCP servers through a dedicated Settings tab.

**Independent Test**: Open Settings → MCP. Add a server URL. Verify it shows "Connected" and lists its tools. Toggle it off — verify the tool count badge in the chat header decreases. Delete the server — verify it disappears from the list.

### Implementation

- [ ] T038 [P] [US5] Build `src/components/Settings/McpSettings/index.tsx` — server list with status badge per server (green "Connected" / red "Disconnected" / yellow "Connecting…" / red "Error: {reason}"); "Add Server" inline form with Name and URL fields and a "Test & Save" button; per-server enable/disable toggle; per-server delete button with confirmation; expandable tool list per connected server showing tool name + description; empty state onboarding message when no servers exist; add `McpSettings.module.css`
- [ ] T039 [US5] Update `src/components/Settings/SettingsPanel.tsx` — add a third "MCP" tab button; render `<McpSettings>` in the MCP tab panel; pass `useTools` add/update/remove actions as props
- [ ] T040 [US5] Connect `McpSettings` actions to `useTools` — "Test & Save": call `useTools.addServer` (saves + attempts connect, updates status live); toggle: call `useTools.updateServer({ enabled })`; delete: call `useTools.removeServer`; reconnect button (on disconnected/error servers): call `useTools.reconnect`
- [ ] T041 [US5] Display tools per server in `McpSettings` — for each connected server show an expandable `<details>` list of `McpTool` items (name in bold, description in muted text); show tool count summary when collapsed (e.g., "3 tools available")
- [ ] T042 [US5] Handle empty state in `McpSettings` — when no servers are configured, show "Add your first MCP server to enable tool use in conversations" with a brief explanation of what MCP servers are and a link to the MCP documentation

**Checkpoint**: US5 fully functional — MCP server management is complete and persists across reloads.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, UX consistency, and final validation across all four features.

- [ ] T043 [P] Harden error messages in `src/services/vision/imageProcessor.ts` — specific user-facing messages for: file too large (show actual size vs. 5 MB limit), unsupported format (list accepted formats), compression failure (suggest trying a smaller image); errors surface to the UI via `InputBox.tsx`
- [ ] T044 [P] Guard `"auto"` sentinel in conversation display — in `src/components/Sidebar/` conversation list items, replace raw `"auto"` model display with "Auto"; ensure `"auto"` is never passed as the `model` field in the OpenAI request body (assert in `streamChat.ts`)
- [ ] T045 [P] Add UX polish for async operations — subtle "Extracting memories…" indicator in the chat input area (disappears after extraction); "Connecting…" spinner on MCP server status badge during `initialize`; both in their respective components without blocking interaction
- [ ] T046 Run quickstart.md validation — manually verify all four independent test scenarios described in `specs/003-advanced-ai-features/quickstart.md`; note any discrepancies as follow-up issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — no dependency on other stories
- **Phase 4 (US2)**: Depends on Phase 2 — no dependency on other stories; uses `inferCapabilities` from T014 which also covers the vision pattern from T007 (US1 does not block US2)
- **Phase 5 (US3)**: Depends on Phase 2 — no dependency on other stories
- **Phase 6 (US4)**: Depends on Phase 2 — no dependency on US1/US2/US3
- **Phase 7 (US5)**: Depends on Phase 6 (uses `useTools` actions) — US5 is the settings UI for US4's backend
- **Phase 8 (Polish)**: Depends on all desired stories being complete

### Within Each Story

- Service/storage layer before hooks
- Hooks before components that consume them
- Components before wiring into App.tsx

### Parallel Opportunities

- T002 and T003 can run in parallel (after T001)
- T005 and T006 can run in parallel (after T004)
- Within US1: T007 and T008 can run in parallel; T009 can run in parallel with T008
- Within US2: T014 is independent and can start at Phase 2 completion
- Within US3: T021 and T022 can run in parallel
- Within US4: T029, T030, and T034 can all run in parallel
- Within US5: T038 can be built in parallel with T039/T040 (different files)
- Phases 3, 4, and 5 (US1, US2, US3) can all be worked in parallel once Phase 2 is done
- Phase 6 (US4) can also run in parallel with US1/US2/US3

---

## Parallel Example: User Story 1

```
# Start together (after T004–T006):
T007: Implement src/services/vision/imageProcessor.ts
T008: Update src/services/openai/openaiClient.ts for MessageContent arrays
T009: Build src/components/ChatInterface/AttachmentPreview/

# After T007 + T008:
T010: Update InputBox.tsx (needs imageProcessor for validation)
T011: Update useChat.ts sendMessage (needs imageProcessor + client changes)

# After T010 + T011:
T012: Update MessageList.tsx to display inline images
T013: Wire through ChatInterface.tsx and App.tsx
```

## Parallel Example: User Story 4

```
# Start together (after T004–T006):
T029: Implement mcpClient.ts
T030: Implement mcpStorage.ts
T034: Build ToolCallBlock component (visual-only, no logic dependencies)

# After T029 + T030:
T031: Implement useTools.ts

# After T031 + T032:
T033: Update useChat.ts with tool call loop

# After T033 + T034:
T035: Update MessageList.tsx to render ToolCallBlock
T036: Wire useTools into App.tsx
T037: Add tool badge to ChatInterface.tsx header
```

---

## Implementation Strategy

### MVP Scope (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: US1 — Multimodal attachments
4. Complete Phase 4: US2 — Auto-routing
5. **STOP and VALIDATE**: Both P1 stories work independently
6. Demo / ship P1 increment

### Incremental Delivery

1. Setup + Foundational → type layer ready
2. US1 (Multimodal) → test independently → demo vision capability
3. US2 (Auto-routing) → test independently → demo "Auto" model selection
4. US3 (Memory) → test independently → demo cross-conversation continuity
5. US4 + US5 (Tools + MCP Config) → test together → demo agent-like tool use

### Parallel Team Strategy

Once Phase 2 is complete:

- Developer A: US1 (Multimodal)
- Developer B: US2 (Auto-routing)
- Developer C: US3 (Memory)
- Developer D: US4 + US5 (Tool Use + MCP Config — these two are tightly coupled)

---

## Notes

- `"auto"` must **never** be forwarded to the OpenAI API as a model ID — assert this in `streamChat.ts` (T044)
- Memory extraction (T022/T025) is fire-and-forget: it must not throw or block the streaming response
- MCP tool calls pause streaming and resume it — ensure the UI reflects the interrupted state correctly (T032/T033)
- Object URLs created for image previews (T009/T010) must be revoked after send to prevent memory leaks
- All localStorage keys use the existing `"ai-chatroom-*"` prefix convention

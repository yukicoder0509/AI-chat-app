# Implementation Plan: Advanced AI Features — Memory, Multimodal, Auto-Routing, Tool Use & MCP

**Branch**: `003-advanced-ai-features` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/003-advanced-ai-features/spec.md`

## Summary

Extends the existing Custom LLM Chat Interface (spec 001) with four independent capability modules: (1) image attachment with vision-aware responses, (2) rule-based automatic model routing, (3) LLM-driven long-term memory across conversations, and (4) tool use via MCP (Model Context Protocol) server connections. Each module integrates into the existing Zustand/React/TypeScript architecture with minimal changes to existing code paths.

## Technical Context

**Language/Version**: TypeScript 5+ (compiled to ES2020)  
**Primary Dependencies**: React 18, Zustand (state), Vite (build), CSS Modules  
**Storage**: localStorage (existing pattern, extended for memories and MCP servers)  
**Testing**: Vitest + React Testing Library (existing)  
**Target Platform**: Modern browser (Chromium, Firefox, Safari)  
**Project Type**: Single-page web application (frontend only, no server)  
**Performance Goals**: Routing adds ≤5 ms per message; memory injection ≤1 s on conversation load; tool call display updates within 200 ms of result receipt  
**Constraints**: No backend proxy; MCP servers must be reachable from browser (CORS); images ≤5 MB; memory storage bounded by localStorage (~5 MB total)  
**Scale/Scope**: Personal/team use; ≤1 000 memory entries; ≤10 MCP servers; ≤5 images per message

## Constitution Check

No project constitution has been defined (`.specify/memory/constitution.md` is a blank template). No gates apply. A constitution should be created before spec 004.

## Project Structure

### Documentation (this feature)

```text
specs/003-advanced-ai-features/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── openai-vision.md
│   └── openai-tools.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code additions

```text
src/
├── components/
│   ├── ChatInterface/
│   │   ├── AttachmentPreview/     image thumbnail + remove button in input area
│   │   └── ToolCallBlock/         collapsible inline tool result card
│   ├── Memory/
│   │   └── MemoryPanel/           modal: view / edit / delete memory entries
│   └── Settings/
│       └── McpSettings/           MCP server list, add/test/toggle controls
├── hooks/
│   ├── useMemory.ts               load, inject, extract, CRUD for MemoryEntry[]
│   └── useTools.ts                connect MCP servers, list tools, execute calls
├── services/
│   ├── memory/
│   │   ├── memoryExtractor.ts     background LLM call for fact extraction
│   │   └── memoryStorage.ts       localStorage CRUD for MemoryEntry[]
│   ├── mcp/
│   │   └── mcpClient.ts           Streamable HTTP JSON-RPC client
│   ├── routing/
│   │   └── taskRouter.ts          keyword classifier + capability registry + router
│   └── vision/
│       └── imageProcessor.ts      MIME validation, resize (Canvas), base64 encode
└── types/
    ├── attachments.ts             Attachment interface
    ├── memory.ts                  MemoryEntry interface
    ├── mcp.ts                     McpServer, McpTool, ToolCall interfaces
    └── routing.ts                 TaskType, RoutingDecision, ModelCapability
```

**Structure Decision**: Single-project frontend. All new code follows the existing `src/` layout conventions. No new build targets or workspaces.

## Implementation Phases

### Phase 1 — Multimodal

Deliverables: image attachment UI, client-side image processing, vision model detection, updated API message format.

Key files:
- `src/types/attachments.ts` (new)
- `src/services/vision/imageProcessor.ts` (new)
- `src/types/openai.ts` — extend `MessageContent` to `string | ContentBlock[]`
- `src/types/chat.ts` — add `attachments?: Attachment[]` to `Message`
- `src/services/openai/openaiClient.ts` — accept content arrays
- `src/components/ChatInterface/AttachmentPreview/` (new)
- `src/components/ChatInterface/InputBox.tsx` — add attachment button + preview strip

### Phase 2 — Auto-Routing

Deliverables: task classifier, capability registry, routing hook, "Auto" option in model dropdown, routing decision badge.

Auto-routing is activated solely by selecting **"Auto"** from the model dropdown — no separate toggle. `selectedModel === "auto"` is the single source of truth. Selecting any specific model immediately disables routing.

Key files:
- `src/types/routing.ts` (new)
- `src/services/routing/taskRouter.ts` (new)
- `src/hooks/useRouting.ts` (new) — fires when `selectedModel === "auto"`, returns resolved model ID per message
- `src/hooks/useModels.ts` — prepend `{ id: "auto", label: "Auto" }` to the model list returned to UI
- `src/components/ChatInterface/ChatInterface.tsx` — routing decision badge in header (task type + chosen model), visible only when `conversation.model === "auto"`
- `src/components/Settings/ModelSelector.tsx` — render "Auto" as the first option

### Phase 3 — Long-Term Memory

Deliverables: memory extraction, storage, injection, management UI, settings toggle.

Key files:
- `src/types/memory.ts` (new)
- `src/services/memory/memoryStorage.ts` (new)
- `src/services/memory/memoryExtractor.ts` (new)
- `src/hooks/useMemory.ts` (new)
- `src/components/Memory/MemoryPanel/` (new)
- `src/hooks/useChat.ts` — inject memories pre-send, extract post-response
- `src/types/settings.ts` — add `memoryEnabled`

### Phase 4 — Tool Use & MCP

Deliverables: MCP client, tool discovery, tool call handling in streaming, UI, settings.

Key files:
- `src/types/mcp.ts` (new)
- `src/services/mcp/mcpClient.ts` (new)
- `src/services/mcp/mcpStorage.ts` (new)
- `src/hooks/useTools.ts` (new)
- `src/services/openai/streamChat.ts` — handle `tool_calls`, accept `tools` option
- `src/services/openai/openaiClient.ts` — non-streaming tool call support
- `src/components/ChatInterface/ToolCallBlock/` (new)
- `src/components/Settings/McpSettings/` (new)
- `src/components/Settings/SettingsPanel.tsx` — add MCP tab
- `src/hooks/useChat.ts` — tool call execution loop

## Complexity Tracking

No constitution violations. All additions follow existing patterns (new files, existing conventions, no new build targets).

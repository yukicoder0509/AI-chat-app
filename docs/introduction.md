# System Introduction

AI Chatroom is a browser-based chat interface for any OpenAI-compatible LLM API. It runs entirely client-side — no backend, no database — connecting directly to the endpoint you configure. All data lives in `localStorage`.

## Core Features

- **Streaming Chat** — token-by-token SSE streaming via a `ReadableStream` pipeline.
- **Multi-Model Support** — fetches `/v1/models` on startup; switch models per conversation.
- **Auto Routing** — classifies each message into a task type and picks the best available model. User-defined keyword rules (Settings > Routing) override the classifier.

  | Task type | Detection | Model preference |
  |---|---|---|
  | `vision` | Image attached | Vision-capable model |
  | `code` | `function`, `debug`, `class`, … | Code-specialized model |
  | `reasoning` | `analyze`, `compare`, `tradeoff`, … | Large / reasoning model |
  | `general` | Fallback | First available model |

- **Long-Term Memory** — extracts up to 5 facts per exchange via a background LLM call; injects them into the system prompt of future conversations.
- **MCP Tool Integration** — connect any MCP server by URL; tools are exposed as OpenAI function-call definitions and executed locally in the browser.
- **Image Attachments** — JPEG / PNG / WebP resized client-side (max 1920 px, JPEG 80%) and sent as base64 data URLs.
- **Conversation Persistence** — all conversations saved to `localStorage` after every mutation; survive page reloads.

## Technology Stack

| Concern | Choice |
|---|---|
| UI / Language | React 18, TypeScript 5 (ES2020) |
| Build / State | Vite 5, Zustand |
| Testing | Vitest + React Testing Library |
| LLM protocol | OpenAI Chat Completions (streaming SSE) |
| Tool protocol | MCP v2025-03-26, JSON-RPC 2.0 over HTTP |
| Persistence | Browser `localStorage` (5 namespaced keys) |

## Quick Start

**Prerequisites**: Node.js v18+, pnpm v8+, an OpenAI-compatible API endpoint and key.

```bash
pnpm install && pnpm run dev   # http://localhost:5173
```

On first launch, enter your API URL and key in **Settings > General**. Optionally pre-fill via `.env.local`:

```env
VITE_LLM_API_URL=https://your-api-host/v1
VITE_LLM_API_KEY=your_api_key_here
```

## Development Commands

```bash
pnpm run dev / build / test / lint
```

## Further Reading

- [Architecture Diagram](architecture.md) — component dependency graph and message send flow
- [Feature Specs](../specs/) — detailed specifications for each feature

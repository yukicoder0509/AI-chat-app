# AI_chatroom Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-25

## Active Technologies

- TypeScript 5+ (compiled to ES2020) (001-custom-llm-chat)
- MCP (Model Context Protocol) — Streamable HTTP transport (003-advanced-ai-features)
- Canvas API — client-side image resize/compress (003-advanced-ai-features)
- IndexedDB-ready localStorage storage pattern (003-advanced-ai-features)

## Project Structure

```text
src/
├── app/           App root, layout, Zustand stores
├── components/    UI components (ChatInterface, Settings, Memory, Common)
├── hooks/         Custom React hooks (useChat, useModels, useMemory, useTools, useRouting)
├── services/      API clients and storage (openai/, mcp/, memory/, routing/, vision/)
└── types/         TypeScript interfaces
tests/
specs/             Feature specifications (001, 003, ...)
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5+ (compiled to ES2020): Follow standard conventions

- State management: Zustand stores in `src/app/store/`
- Styling: CSS Modules (`.module.css` per component)
- Storage: localStorage (JSON serialised); key prefix `ai-chatroom-*`
- API: OpenAI-compatible chat completions; streaming via `ReadableStream`
- MCP: Streamable HTTP JSON-RPC 2.0 (`fetch` + `ReadableStream`)

## Recent Changes

- 003-advanced-ai-features: Added MCP client, image processing, routing, memory storage patterns
- 001-custom-llm-chat: Added TypeScript 5+ (compiled to ES2020)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

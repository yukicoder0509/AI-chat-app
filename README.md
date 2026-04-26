# AI Chatroom

A modern React-based chat interface for OpenAI-compatible LLM APIs with streaming responses, multi-model routing, long-term memory, MCP tool integration, and image attachments.

## Features

- **Streaming Responses** — real-time token streaming with visual feedback
- **Model Selection** — switch models per conversation; auto-detects available models via `/v1/models`
- **Auto Routing** — set model to "Auto" and the app classifies each message (vision / code / reasoning / general) and picks the best available model automatically
- **Custom Routing Rules** — define keyword → model rules in Settings > Routing; rules are matched top-to-bottom before the default classifier, so you can pin specific queries to a specific model
- **Long-Term Memory** — after each exchange the app extracts facts and stores them in the browser; recalled facts are injected into the system prompt of future conversations
- **MCP Tool Integration** — connect any MCP (Model Context Protocol) server via HTTP; tools are listed to the model as function calls and executed locally in the browser
- **Image Attachments** — attach JPEG / PNG / WebP images (resized and compressed client-side) to any message for vision-capable models
- **System Prompt** — configure a default system prompt globally or per conversation
- **API Parameters** — tune temperature, max tokens, top-p, frequency / presence penalty
- **Conversation History** — conversations persist across page reloads

## Quick Start

### Prerequisites

- Node.js v18 or higher
- pnpm v8 or higher
- An OpenAI-compatible API endpoint and key

### Installation

```bash
pnpm install
pnpm run dev
```

The app will be available at `http://localhost:5173`. Enter your API URL and key in **Settings > General** on first launch.

### Environment Variables (optional)

You can pre-fill the API settings via a `.env.local` file so they appear on first load:

```env
VITE_LLM_API_URL=https://your-api-host/v1
VITE_LLM_API_KEY=your_api_key_here
```

## Data Storage

Everything is stored in the **browser's `localStorage`** — no data leaves your machine except the API calls you make to your configured endpoint.

| Key | What is stored |
|-----|----------------|
| `ai-chatroom-conversations` | All conversation history (messages, model used, system prompt, timestamps) |
| `ai-chatroom-settings` | API URL, API key, selected model, system prompt, API parameters, feature flags |
| `ai-chatroom-memories` | Extracted memory facts (key/value pairs recalled across conversations) |
| `ai-chatroom-mcp-servers` | MCP server configurations (name, URL, enabled flag) |
| `ai-chatroom-routing-config` | User-defined keyword → model routing rules |

All keys are scoped with the `ai-chatroom-` prefix. You can clear everything by opening your browser's DevTools → Application → Local Storage and deleting the entries, or by using the "Reset to Defaults" button in Settings (clears settings only).

> **Note on privacy**: your API key is stored in `localStorage` in plaintext. Do not use this app on a shared or public computer without clearing the key afterwards.

## Auto Routing

When a conversation's model is set to **"Auto"**, the app selects a model for each message using a two-step process:

1. **User rules** (Settings > Routing) — checked first, top-to-bottom. Each rule has a keyword (plain text or regex) and a target model. The first rule whose keyword matches the message wins, provided the target model is currently available.
2. **Capability classifier** — if no rule matches, the message is classified by content:
   - Has an image attachment → `vision` → picks a vision-capable model
   - Contains code keywords (`function`, `debug`, `syntax`, …) → `code` → picks a code model
   - Contains reasoning keywords (`analyze`, `compare`, `tradeoff`, …) → `reasoning` → picks a large/reasoning model
   - Otherwise → `general` → picks the first available model

The selected model is shown in the chat header and as a badge on each completed assistant message.

## MCP Tools

Connect an MCP server in **Settings > MCP**:

1. Click **Add Server**, enter a name and the server's HTTP URL.
2. Click **Connect** — the app fetches the tool list via JSON-RPC `tools/list`.
3. Connected tools appear as function-call tools in every subsequent message.
4. When the model calls a tool, the app executes it via `tools/call` and feeds the result back automatically.

The number of connected tools is shown as a badge in the chat header.

## Development

```bash
pnpm run dev          # start dev server
pnpm run build        # production build → dist/
pnpm run test         # run tests (Vitest)
pnpm run test:ui      # Vitest UI
pnpm run test:coverage
pnpm run lint
```

## Project Structure

```
src/
├── app/                  # App root, layout, Zustand stores
├── components/
│   ├── ChatInterface/    # MessageList, InputBox, AttachmentPreview, ToolCallBlock
│   ├── Memory/           # MemoryPanel
│   ├── Settings/         # SettingsPanel, McpSettings, RoutingRulesEditor, …
│   ├── Sidebar/          # Conversation list
│   └── Common/           # Button, Input, …
├── hooks/                # useChat, useMemory, useTools, useRouting, useModels, useSettings
├── services/
│   ├── mcp/              # MCP JSON-RPC client + server config storage
│   ├── memory/           # Memory extraction (LLM) + localStorage storage
│   ├── openai/           # Streaming chat completions client
│   ├── routing/          # Task classifier, model selector, routing config storage
│   ├── storage/          # Conversation persistence
│   └── vision/           # Client-side image resize / compress
└── types/                # TypeScript interfaces (chat, mcp, memory, routing, …)
tests/                    # Vitest test suites
specs/                    # Feature specifications and implementation plans
```

## Technology Stack

- **Frontend**: React 18, TypeScript 5 (ES2020)
- **Build**: Vite 5
- **State**: Zustand
- **Styling**: CSS Modules
- **Testing**: Vitest, React Testing Library
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm

## License

MIT

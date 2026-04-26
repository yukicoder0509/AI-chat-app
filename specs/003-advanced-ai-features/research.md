# Research: Advanced AI Features

**Branch**: `003-advanced-ai-features` | **Date**: 2026-04-25

---

## 1. Multimodal (Vision) Input

### Image Request Format

**Decision**: Use the OpenAI-compatible content-array format for messages with attachments.

Messages with images replace the string `content` field with an array of typed content blocks:
- `{ type: "text", text: "..." }` for text
- `{ type: "image_url", image_url: { url: "data:image/jpeg;base64,...", detail: "auto" } }` for images

Multiple images can appear in a single message. The `detail` parameter defaults to `"auto"` (model decides resolution vs. token cost tradeoff).

**Rationale**: This is the established OpenAI-compatible standard. Both hosted providers (OpenAI, together.ai) and local inference servers (Ollama, llama.cpp) use this format.

**Alternatives considered**: A separate `images` field at the top level — rejected because it breaks OpenAI compatibility and is not supported by any known provider.

---

### Image Encoding

**Decision**: Use base64 data URLs for all user-uploaded images.

**Browser workflow**:
1. User picks file → generate `Object URL` for instant thumbnail preview
2. On send: compress (Canvas API, max 1920×1920px, 80% JPEG quality), encode to base64 data URL
3. Send base64 in the `image_url.url` field
4. After send: revoke the Object URL to free memory

**Rationale**: Base64 is self-contained and avoids CORS or hosting complexity. All OpenAI-compatible providers accept it. Object URLs for preview avoid the 33% encoding overhead during the preview phase.

**Alternatives considered**: Public HTTP URLs — rejected because user-uploaded files are not hosted anywhere publicly.

---

### Image Size Limit

**Decision**: 5 MB hard limit enforced client-side before any encoding.

**Rationale**: The upstream OpenAI API accepts up to 50 MB total, but a 5 MB limit keeps base64-encoded payloads under ~6.7 MB, which is safe for browser memory and localStorage/IndexedDB. Research shows browser memory issues occur with larger payloads on mobile devices. Most meaningful images (photos, screenshots, diagrams) are well under 5 MB.

---

### Vision-Capable Model Detection

**Decision**: Pattern-based inference from model ID string, with a user-overridable flag.

The `/v1/models` endpoint does not expose a standard capabilities field. Vision capability is inferred from model ID patterns:

| Pattern | Examples |
|---------|---------|
| `gpt-4o` | `gpt-4o`, `gpt-4o-mini` |
| `gpt-4.*turbo` or `gpt-4.*vision` | `gpt-4-turbo`, `gpt-4-vision-preview` |
| `llava` | `llava-1.6`, `llava-phi3` |
| `qwen.*vl` or `qwen.*vision` | `qwen2.5-vl`, `qwen-vl-chat` |
| `moondream` | `moondream2` |
| `minicpm-v` | `minicpm-v-2_6` |

**Alternatives considered**: Querying a separate capabilities API — no standard exists. Requiring users to manually tag each model — too much friction.

---

## 2. Automatic Model Routing

### Classification Strategy

**Decision**: Rule-based keyword matching as the sole classification method.

A small set of regular-expression rules classifies each message into one of four task types before the API call:

| Task Type | Signals |
|-----------|---------|
| `vision` | Image attachment present |
| `code` | Code fences (```) or code-specific keywords (`function`, `debug`, `syntax`, `import`, `script`) |
| `reasoning` | Analytical keywords (`analyze`, `architecture`, `compare`, `tradeoff`, `design`) |
| `general` | Default fallback |

**Rationale**: Rule-based classification adds 0-5 ms — imperceptible. A secondary LLM call would add 200-800 ms per message, which exceeds the acceptable routing budget (≤500 ms before first token). Accuracy is sufficient for coarse task routing; the user can always override.

**Alternatives considered**: Secondary LLM classification — rejected due to latency. Local embedding model — rejected due to WASM startup time (500–2000 ms cold).

---

### Model Capability Mapping

**Decision**: Client-side capability registry populated by keyword inference from model IDs, merged with user-configurable overrides.

At startup the app infers capabilities for each model returned by `/v1/models`:
- Vision: match vision patterns (see above)
- Code: match `coder`, `code`, `starcoder`, `deepseek-coder`
- Reasoning: match `70b`, `72b`, `opus`, `gpt-4`, `claude-3`
- General: all models qualify as fallback

Routing selects the best matching model. Tie-breaking prefers the model currently selected by the user. If no model matches the required capability, falls back to the user's default model.

**Alternatives considered**: Fetching a capabilities manifest from the API — no standard endpoint exists.

---

### Routing Latency Budget

**Decision**: Rule-based only; total routing overhead ≤5 ms per message.

User-perceptible latency threshold is ~2 seconds to first token. Routing must stay well under 500 ms. Rule-based classification comfortably achieves this.

---

## 3. Long-Term Memory

### Extraction Timing and Method

**Decision**: Extract after each completed assistant response, using a lightweight LLM call to a small/fast model.

After `finishStreaming()`, a background extraction request is fired — it does not block the UI. The extraction prompt asks the model to return a JSON array of discrete facts from the last exchange (0-5 facts). Temperature is set to 0.3 for determinism.

**Rationale**: Per-message extraction captures facts while context is fresh. Background execution avoids adding latency to the user's experience. Using the same API endpoint (but a smaller model where possible) avoids adding infrastructure.

**Alternatives considered**: End-of-conversation extraction — risks losing facts if the user closes the tab without ending the conversation explicitly. Manual user-initiated extraction — adds friction and misses passive facts.

---

### Memory Injection

**Decision**: Inject a fixed-size block of the most recently created memories into the system prompt of each new conversation. Cap at 10 memories / ~500 tokens.

Simple recency-based selection is used for the initial implementation (no embedding similarity search). The memory block is prepended to the existing system prompt.

**Rationale**: Embedding similarity requires either a WASM embedding model (slow cold start) or a remote API call (latency + privacy concern). Recency-based injection is good enough for a personal assistant use case where facts accumulate over time.

**Alternatives considered**: Embedding-based relevance filtering — deferred to a future iteration.

---

### Storage

**Decision**: Store memories in `localStorage` using a JSON array, keyed separately from conversation storage. Migrate to IndexedDB if the memory store exceeds 1 000 entries.

**Rationale**: Keeps the storage layer consistent with existing conversation storage. IndexedDB migration can be addressed in a follow-up if needed; for a personal assistant use case, most users will accumulate far fewer than 1 000 memories.

**Alternatives considered**: IndexedDB from the start — adds implementation complexity and a dependency (e.g., Dexie.js) not justified by expected data volume.

---

## 4. Tool Use & MCP

### MCP Transport

**Decision**: Streamable HTTP (HTTP POST + optional SSE response) — the only browser-compatible MCP transport.

- **Stdio** is not available in browsers (cannot spawn processes).
- **SSE-only** (legacy MCP) is deprecated.
- **Streamable HTTP** uses standard `fetch` + `ReadableStream` APIs and works natively in all modern browsers.

The user provides the URL of their MCP server. The app connects directly from the browser using `fetch`. The MCP server must be accessible from the browser (local network or publicly reachable) and must return permissive CORS headers.

**Rationale**: No backend gateway or proxy is added to this app — it is a purely frontend application. Users running local MCP servers (e.g., on `localhost`) get CORS for free since same-origin requests don't need CORS headers.

**Alternatives considered**: Backend proxy gateway — rejected because the app has no server component and adding one is out of scope for this feature. WebSocket transport — not yet standardized in MCP.

---

### Tool Schema Integration

**Decision**: Convert MCP `inputSchema` (JSON Schema) directly to the OpenAI tools API `parameters` format when tools are discovered.

Mapping: `{ name, description, inputSchema }` → `{ type: "function", function: { name, description, parameters: inputSchema } }`. The schemas are structurally identical; only the wrapper object differs.

The tools list is fetched at MCP server connection time and cached for the session. It is re-fetched when the user manually refreshes or reconnects.

---

### Tool Call Flow

**Decision**: Intercept `tool_calls` in streaming assistant messages, execute each tool against the MCP server sequentially, then send results back as `tool` role messages to get the final response.

Tool calls are displayed as collapsible inline blocks in the chat. The execution state progresses: `pending → running → complete | error`. Streaming of the final assistant response begins only after all tool results are returned, keeping the UI simple.

**Alternatives considered**: Parallel tool execution — more complex to coordinate; deferred to future iteration.

---

## Resolved Clarifications

| Item | Resolution | Source |
|------|-----------|--------|
| FR-006 image size limit | 5 MB client-side cap | Browser memory research; provider limits are much higher but impractical |
| MCP transport in browser | Streamable HTTP only (stdio impossible) | MCP protocol spec |
| Vision model detection | Pattern-based ID matching | OpenAI `/v1/models` has no capabilities field |
| Memory storage backend | localStorage (same as conversations) | Adequate for personal-scale data; IndexedDB deferred |
| Routing classification | Rule-based keyword matching (0-5 ms) | LLM-based routing latency exceeds budget |

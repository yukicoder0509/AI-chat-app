# Feature Specification: Advanced AI Features — Memory, Multimodal, Auto-Routing, Tool Use & MCP

**Feature Branch**: `003-advanced-ai-features`
**Created**: 2026-04-25
**Status**: Draft
**Input**: User description: "Based on spec 001 (Custom LLM Chat Interface), add: long-term memory, multimodal input, auto routing between models, tool use with MCP"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Attach an Image and Receive a Vision-Aware Response (Priority: P1)

A user attaches an image to a chat message. The system detects that the active model supports vision, sends the image along with the message, and the assistant responds with observations or analysis of the image.

**Why this priority**: Multimodal input is the highest-impact new capability. It unlocks image analysis, diagram explanation, and screenshot debugging with a self-contained flow that delivers value independently.

**Independent Test**: Can be fully tested by (1) attaching an image, (2) typing a question about it, (3) sending, and (4) verifying the assistant's response references the image content.

**Acceptance Scenarios**:

1. **Given** the chat input is visible, **When** the user clicks the attachment button or drags an image into the input area, **Then** a thumbnail preview appears in the input area before sending
2. **Given** an image is attached and a message is typed, **When** the user sends, **Then** the image and message are both visible in chat history and the assistant receives both
3. **Given** the selected model does not support vision, **When** the user attempts to attach an image, **Then** a clear warning explains the current model cannot process images
4. **Given** an image is attached, **When** the user removes it before sending, **Then** the attachment is cleared and the input returns to its normal state

---

### User Story 2 — System Automatically Routes to the Best Model When "Auto" Is Selected (Priority: P1)

A user selects "Auto" from the model dropdown (available alongside specific model names). For every message sent while "Auto" is active, the system analyses the message, detects the task type (code, vision, complex reasoning, simple Q&A), and picks the most appropriate model from those available. The user always retains the ability to switch to any specific model at any time, which immediately stops auto-routing.

**Why this priority**: "Auto" as a first-class model option removes model-selection burden from users without taking away control — users who want a specific model simply select it.

**Independent Test**: Can be fully tested by (1) selecting "Auto" in the model dropdown, (2) sending messages of three different types (code, image, general question), and (3) verifying a different model is selected for each, then (4) selecting a specific model and confirming the next message uses that model regardless of task type.

**Acceptance Scenarios**:

1. **Given** "Auto" is selected as the model, **When** the user sends a message containing a code snippet, **Then** the system selects a code-optimised model and shows the routing decision (task type + chosen model) in the chat header
2. **Given** "Auto" is selected, **When** the user attaches an image, **Then** the system automatically selects a vision-capable model
3. **Given** "Auto" is active and the system has routed to a model, **When** the user selects any specific model from the dropdown, **Then** that model is used for all subsequent messages and auto-routing stops until the user selects "Auto" again
4. **Given** "Auto" is selected but no suitable model is available for the detected task type, **Then** the system falls back to the first available model and displays a notification explaining the fallback

---

### User Story 3 — Long-Term Memory Recalled Across Conversations (Priority: P2)

During a conversation the system identifies and stores notable facts about the user. In subsequent conversations these memories are provided to the assistant, enabling continuity without the user repeating themselves.

**Why this priority**: Long-term memory significantly improves personalisation and usefulness over time but is not required for core chat functionality.

**Independent Test**: Can be fully tested by (1) stating a specific fact in conversation A, (2) starting a fresh conversation B, and (3) asking the assistant about that fact to verify recall.

**Acceptance Scenarios**:

1. **Given** the user states a notable fact (e.g., "I'm building a Python project"), **When** the message is processed, **Then** the relevant fact is extracted and stored as a memory entry
2. **Given** memories exist, **When** the user starts a new conversation, **Then** relevant memories are included in context and the assistant can reference them naturally
3. **Given** the user opens the memory management panel, **When** it loads, **Then** all stored memories are listed with their creation date
4. **Given** a stored memory is wrong or outdated, **When** the user edits or deletes it, **Then** the change takes effect in the next conversation immediately
5. **Given** the memory feature is disabled, **When** conversations occur, **Then** no new memories are stored and existing memories are not injected into context

---

### User Story 4 — Tools Invoked Automatically During a Response (Priority: P2)

A user asks a question that benefits from a tool (web search, code execution, calculator, file lookup). The assistant, connected to one or more MCP servers, invokes the relevant tool mid-response and incorporates the result into its final answer. The tool call and its output are visible inline in the conversation.

**Why this priority**: Tool use transforms the assistant from a knowledge retrieval system into an action-capable agent. It is P2 because it requires prior MCP server configuration.

**Independent Test**: Can be fully tested by (1) configuring one MCP server, (2) asking a question that triggers that tool, and (3) verifying the tool result appears inline and informs the response.

**Acceptance Scenarios**:

1. **Given** an MCP server is configured, **When** the assistant invokes a tool, **Then** a collapsible "Tool Used" block showing the tool name and result appears before the final response
2. **Given** a tool call is in progress, **When** the user views the chat, **Then** a loading indicator shows the tool is being executed
3. **Given** a tool call fails, **When** the error is returned, **Then** the failure is displayed inline and the assistant provides a best-effort response without the result
4. **Given** no MCP servers are configured, **When** the user enables tool use, **Then** a guided prompt directs them to add an MCP server in settings

---

### User Story 5 — Configure and Manage MCP Server Connections (Priority: P3)

A user can add, test, enable/disable, and remove MCP server connections through the settings panel. Each connection specifies a server endpoint and exposes the tools that server provides.

**Why this priority**: MCP configuration is a prerequisite for tool use but is a one-time setup task that runs transparently afterwards.

**Independent Test**: Can be fully tested by (1) adding an MCP server URL in settings, (2) verifying it shows as connected, and (3) confirming its tools appear in the active tool list.

**Acceptance Scenarios**:

1. **Given** settings is open, **When** the user navigates to the MCP tab, **Then** configured servers are listed (empty state if none) with an "Add Server" option
2. **Given** a valid MCP server URL is entered and saved, **When** the system tests the connection, **Then** the server shows as "Connected" and its available tools are listed
3. **Given** a configured server is unreachable, **When** the system attempts to connect, **Then** the server shows as "Disconnected" with a reason
4. **Given** a user toggles a server off, **When** the next message is sent, **Then** that server's tools are unavailable until it is re-enabled, without deleting the configuration

---

### Edge Cases

- What happens when an attached image exceeds the model's size limit? (Resize automatically or reject with a clear limit message)
- What if the same fact appears in multiple conversations? (Deduplicate or update the existing memory entry rather than creating duplicates)
- What happens when "Auto" routes to a different model than was used for earlier messages in the same conversation? (Show the routing decision clearly; the conversation history is still sent as context regardless of which model is used for each message)
- What if a tool returns an extremely large result? (Truncate with a summary; offer to expand inline)
- What if multiple tools are invoked in sequence within one response? (Each appears as a separate ordered inline block)
- What if memory extraction falsely identifies something as a memorable fact? (User can delete it from the memory management panel)

## Requirements _(mandatory)_

### Functional Requirements

**Multimodal**

- **FR-001**: System MUST allow users to attach images to chat messages via a file picker or drag-and-drop
- **FR-002**: System MUST display a thumbnail preview of attached images in the input area before sending
- **FR-003**: System MUST warn the user when the selected model does not support image input before allowing submission
- **FR-004**: System MUST display attached images inline in conversation history alongside the message text
- **FR-005**: System MUST support at minimum JPEG, PNG, and WebP image formats
- **FR-006**: System MUST enforce a 5 MB maximum image file size and inform the user when the limit is exceeded (stricter than the upstream API limit to avoid browser memory issues)

**Auto-Routing**

- **FR-007**: System MUST include "Auto" as a selectable option in the model dropdown alongside all specific model names returned by the API
- **FR-008**: When "Auto" is selected, system MUST analyse each message and select the most appropriate available model based on detected task type before sending
- **FR-009**: System MUST display the routing decision (task type detected and model chosen) visibly in the chat header for each message sent while "Auto" is active
- **FR-010**: Selecting any specific model from the dropdown MUST immediately stop auto-routing; all subsequent messages use that model until the user selects "Auto" again
- **FR-011**: When "Auto" is selected but no suitable model is available for the detected task type, system MUST fall back to the first available model and notify the user

**Long-Term Memory**

- **FR-012**: System MUST automatically extract and store notable facts from conversations without requiring manual user action
- **FR-013**: System MUST inject relevant stored memories into the assistant's context at the start of each new conversation
- **FR-014**: System MUST provide a memory management panel listing all stored memories with their creation dates
- **FR-015**: Users MUST be able to edit individual memory entries to correct inaccuracies
- **FR-016**: Users MUST be able to delete individual memory entries or clear all memories at once
- **FR-017**: System MUST persist memories locally across application reloads
- **FR-018**: When the memory feature is disabled, system MUST neither store new memories nor inject existing ones into context

**Tool Use & MCP**

- **FR-019**: System MUST allow users to add MCP server connections (name, URL) via the settings panel
- **FR-020**: System MUST test MCP server connectivity when a server is added and display connection status
- **FR-021**: When a tool is invoked during a response, system MUST display the tool name and result as a collapsible inline block in the conversation
- **FR-022**: System MUST show a loading indicator while a tool call is in progress
- **FR-023**: System MUST handle tool call failures gracefully — display the error inline and continue generating a response
- **FR-024**: Users MUST be able to toggle individual MCP servers on or off without deleting them
- **FR-025**: System MUST list all tools available from connected MCP servers so users know which capabilities are active

### Key Entities

- **Memory Entry**: A stored fact extracted from conversation, with content, source conversation ID, creation date, and last-modified date
- **Memory Store**: The local collection of all memory entries, with a global enabled/disabled flag
- **Attachment**: An image attached to a message, with format, file size, preview URL, and send status
- **Routing Decision**: The auto-routing output for a message — detected task type, selected model, and whether the user overrode it
- **MCP Server**: A configured tool server with name, URL, connection status, and list of available tools
- **Tool Call**: A record of a single tool invocation — tool name, input parameters, result or error, status, and timestamp

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can attach an image and receive a vision-aware response without any additional configuration steps beyond selecting a vision-capable model
- **SC-002**: Auto-routing selects the correct model category (code, vision, general) in at least 85% of representative test messages
- **SC-003**: Stored memories from a prior conversation are available to the assistant within 1 second of a new conversation loading
- **SC-004**: Tool call results appear inline within 3 seconds of the tool completing, excluding network latency of the tool itself
- **SC-005**: Users can add and successfully connect an MCP server in under 2 minutes without reading documentation
- **SC-006**: The memory management panel loads and displays up to 100 stored entries without noticeable delay
- **SC-007**: Disabling a memory entry or MCP server takes effect on the very next message sent
- **SC-008**: 90% of users can locate the memory panel and delete a memory entry on first attempt without guidance

### Assumptions

- All four features build on the existing 001 chat interface; the streaming, conversation storage, and settings architecture remain unchanged
- Long-term memories are stored locally in the browser alongside existing conversation data — no server-side sync in this iteration
- Auto-routing uses the model list already fetched from `/v1/models` and infers task suitability from model names/IDs; no external routing service is required
- MCP servers are user-provided; no bundled default servers are included in this iteration
- Multimodal support requires the selected or auto-routed model to natively support image input; no in-app image processing is performed
- Memory extraction is performed by the LLM itself (via a system-level prompt instructing it to identify memorable facts) rather than a separate pipeline
- File attachments beyond images (PDFs, documents, audio) are out of scope for this iteration

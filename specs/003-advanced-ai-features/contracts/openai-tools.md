# Contract: OpenAI-Compatible Tool Use Format

**Feature**: Tool use & MCP integration

---

## Request format — sending tools

```json
{
  "model": "gpt-4o",
  "messages": [...],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "tool_name",
        "description": "Human-readable description of what the tool does",
        "parameters": {
          "type": "object",
          "properties": {
            "param1": { "type": "string", "description": "..." }
          },
          "required": ["param1"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

`parameters` is the MCP tool's `inputSchema` object passed through directly.

---

## Response format — tool call in assistant message

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "tool_name",
        "arguments": "{\"param1\": \"value\"}"
      }
    }
  ]
}
```

`arguments` is a JSON-encoded string (not an object).

---

## Tool result message

```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "Result text returned by the tool"
}
```

---

## Multi-turn tool flow

```
1. User message + tools array → API
2. API returns assistant message with tool_calls
3. App executes each tool against MCP server (tools/call)
4. App appends tool result messages
5. Send updated messages back to API
6. API returns final assistant text response
```

---

## MCP JSON-RPC requests (Streamable HTTP)

### Initialize session

```json
POST {mcpServerUrl}
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": { "name": "ai-chatroom", "version": "0.3.0" }
  }
}
```

### List tools

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "tool_name",
        "description": "What it does",
        "inputSchema": { "type": "object", "properties": {...}, "required": [...] }
      }
    ]
  }
}
```

### Call tool

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": { "param1": "value" }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{ "type": "text", "text": "Tool result here" }],
    "isError": false
  }
}
```

---

## Constraints

| Property | Value |
|----------|-------|
| MCP transport | Streamable HTTP (HTTP POST) |
| Maximum tools per request | 128 (OpenAI limit) |
| `tool_choice` default | `"auto"` |
| Tool execution order | Sequential (one at a time) |
| CORS requirement | MCP server must allow browser origin |

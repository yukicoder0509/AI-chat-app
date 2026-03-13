# Contract: OpenAI Chat Completions API Integration

**Date**: 2026-03-13  
**Provider**: OpenAI  
**Scope**: Browser-based integration for streaming chat completions

## Overview

This application communicates directly with OpenAI's Chat Completions API from the browser. All API calls use the user's provided API key. This contract documents the request/response formats, error handling, and streaming behavior.

## API Endpoint

**Base URL**: `https://api.openai.com/v1`  
**Endpoint**: `POST /chat/completions`  
**Protocol**: HTTPS (required)

## Authentication

**Method**: Bearer token in Authorization header  
**Format**: `Authorization: Bearer sk-...`  
**Key Source**: User provides their OpenAI API key in the UI

```javascript
const headers = {
  Authorization: `Bearer ${userApiKey}`,
  "Content-Type": "application/json",
};
```

## Request Contract

### Standard (Non-Streaming) Request

```typescript
interface ChatCompletionRequest {
  model: string; // 'gpt-4' or 'gpt-3.5-turbo'
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number; // 0-2, default 1
  top_p?: number; // 0-1, default 1
  max_tokens?: number; // Max response tokens
  frequency_penalty?: number; // -2 to 2, default 0
  presence_penalty?: number; // -2 to 2, default 0
  stream?: boolean; // Set to true for streaming
}
```

### Streaming Request

```typescript
// Same as above, with stream: true
interface StreamingChatCompletionRequest extends ChatCompletionRequest {
  stream: true;
}
```

**Example Request**:

```javascript
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer sk-...
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant."
    },
    {
      "role": "user",
      "content": "How do I reverse a string in JavaScript?"
    }
  ],
  "temperature": 0.7,
  "top_p": 1,
  "max_tokens": 500,
  "stream": true
}
```

## Response Contract

### Standard (Non-Streaming) Response

```typescript
interface ChatCompletionResponse {
  id: string; // Chat completion ID
  object: "chat.completion";
  created: number; // Unix timestamp
  model: string; // Model used
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter" | "function_call";
    index: number;
  }>;
}
```

### Streaming Response

**Format**: Server-sent events (SSE) with JSON deltas

Each chunk is a JSON object prefixed with "data: ":

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: [DONE]
```

**Streaming Chunk Structure**:

```typescript
interface StreamingChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: "assistant"; // Only in first chunk
      content?: string; // Text content (may be empty)
    };
    finish_reason:
      | null
      | "stop"
      | "length"
      | "content_filter"
      | "function_call";
  }>;
}
```

**Stream Termination**: Final line is `data: [DONE]` (no JSON)

## Error Responses

### Authentication Error (401)

```json
{
  "error": {
    "message": "Incorrect API key provided...",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

### Rate Limit (429)

```json
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "server_error",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

**Response Header**: `Retry-After: {seconds}`

### Quota Exceeded (429)

```json
{
  "error": {
    "message": "You exceeded your current quota, please check your plan and billing settings.",
    "type": "insufficient_quota",
    "param": null,
    "code": "insufficient_quota"
  }
}
```

### Model Not Found (404)

```json
{
  "error": {
    "message": "The model `gpt-100` does not exist",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

### Context Length Exceeded (400)

```json
{
  "error": {
    "message": "This model's maximum context length is 4096 tokens, however you requested...",
    "type": "invalid_request_error",
    "param": "messages",
    "code": "context_length_exceeded"
  }
}
```

## Implementation Patterns

### Streaming Response Handler (TypeScript)

```typescript
async function streamChatCompletion(
  apiKey: string,
  request: ChatCompletionRequest,
): Promise<AsyncIterableIterator<string>> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error.message}`);
  }

  // Return async iterator over decoded JSON chunks
  return decodeStream(response.body);
}

// Consume stream
for await (const chunk of streamChatCompletion(apiKey, request)) {
  // Process chunk
  console.log(chunk.choices[0].delta.content);
}
```

### Token Counting

For cost estimation and context window management:

```typescript
// OpenAI tokenizer library (client-side)
import { encoding_for_model } from "js-tiktoken";

async function estimateTokens(text: string, model: string): Promise<number> {
  const encoding = encoding_for_model(model);
  const tokens = encoding.encode(text);
  return tokens.length;
}
```

## Error Handling Strategy

| Error                   | HTTP Code | User Message                                   | Action                              |
| ----------------------- | --------- | ---------------------------------------------- | ----------------------------------- |
| Invalid API key         | 401       | "API key invalid. Please check your settings." | Prompt to enter new key             |
| Rate limited            | 429       | "Rate limit reached. Please wait a moment."    | Auto-retry with exponential backoff |
| Quota exceeded          | 429       | "Account quota exceeded. Check billing."       | Show billing link                   |
| Model not available     | 404       | "Model not available. Use another."            | Show available models               |
| Context length exceeded | 400       | "Conversation too long. Clear history."        | Offer to truncate history           |
| Network error           | N/A       | "Connection lost. Retrying..."                 | Auto-retry with backoff             |
| Timeout                 | N/A       | "Request timed out. Try again."                | Manual retry button                 |

## Request Limits (API Side)

- **Max message length**: 4000 characters per message (content)
- **Max total tokens**: Depends on model (GPT-4: 8192, GPT-3.5: 4096)
- **Rate limits**: Varies by plan (free tier: 3 req/min)
- **Max requests/minute**: 20-100 depending on plan
- **Timeout**: 30 seconds per request (typical cloud function limit)

## Application-Side Constraints

- **Max messages per conversation**: 50 (for MVP to avoid excessive token costs)
- **Max API parameters**:
  - `temperature`: 0.0 - 2.0 (strict)
  - `top_p`: 0.0 - 1.0 (strict)
  - `frequency_penalty`: -2.0 to 2.0 (strict)
  - `presence_penalty`: -2.0 to 2.0 (strict)
  - `max_tokens`: 1 - model_max_tokens

## Future Enhancements

- **Function calling**: Not implemented in MVP (step 1: chat only)
- **Vision capabilities**: Not implemented (text-only in MVP)
- **Embedding endpoints**: Not used in MVP (no semantic search)
- **Moderation API**: Optional for content safety (not in MVP)

---

## Validation Checklist

Before deploying API integration:

- [ ] Streaming response chunks are parsed correctly
- [ ] [DONE] marker properly terminates stream
- [ ] Error responses are handled and displayed to user
- [ ] API key is never logged or exposed in console
- [ ] Rate limiting is handled with proper backoff
- [ ] Network timeouts don't crash the application
- [ ] Token counts are estimated and shown to user
- [ ] Context window limits prevent over-request
- [ ] CORS headers are properly handled

Reference: [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/chat/create)

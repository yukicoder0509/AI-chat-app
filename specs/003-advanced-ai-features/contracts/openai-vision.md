# Contract: OpenAI-Compatible Vision Request Format

**Feature**: Multimodal image attachments  
**Extends**: `specs/001-custom-llm-chat/contracts/openai-api.md`

---

## Extended message content format

When a message includes one or more image attachments, the `content` field changes from a plain string to an array of typed content blocks.

### Text-only message (unchanged)

```json
{
  "role": "user",
  "content": "What is the capital of France?"
}
```

### Message with image(s)

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "What is shown in this diagram?"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
        "detail": "auto"
      }
    }
  ]
}
```

Multiple images are supported by adding additional `image_url` blocks to the array.

---

## Constraints

| Property | Value |
|----------|-------|
| Supported MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Maximum file size (client-enforced) | 5 MB (5 242 880 bytes) before base64 encoding |
| Maximum encoded payload per image | ~6.7 MB (base64 adds ~33%) |
| `detail` default | `"auto"` |
| `detail` allowed values | `"auto"`, `"low"`, `"high"` |

---

## Vision capability detection (client-side)

No standard `/v1/models` capability field exists. Vision support is inferred from model ID using these patterns:

```
gpt-4o
gpt-4.*turbo
gpt-4.*vision
llava
moondream
qwen.*vl
qwen.*vision
minicpm-v
```

If no pattern matches, the model is assumed to **not** support vision and the attachment button is disabled with an explanatory tooltip.

---

## Type changes to `OpenAIRequestBody`

```typescript
type TextContent  = { type: "text"; text: string };
type ImageContent = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
type MessageContent = string | Array<TextContent | ImageContent>;

interface OpenAIMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: MessageContent;
  tool_call_id?: string;   // present when role === "tool"
}
```

# Phase 1 Design: Data Model

**Date**: 2026-03-13  
**Purpose**: Define entity structures and TypeScript type definitions for the application

## Core Entities

### Message Entity

**Purpose**: Represents a single message in a conversation (user or assistant)

**TypeScript Definition**:

```typescript
type MessageRole = "user" | "assistant";

interface Message {
  id: string; // UUID format
  role: MessageRole; // Who sent this message
  content: string; // Message text content
  timestamp: number; // Unix timestamp (milliseconds)
  tokenCount?: number; // Estimated tokens (optional, calculated on save)
  streamingId?: string; // Reference to streaming response (for tracking)
}
```

**Attributes**:

- `id`: Unique identifier, generated client-side for offline-first design
- `role`: Either 'user' (human input) or 'assistant' (LLM response)
- `content`: Full message text (may contain multiple paragraphs)
- `timestamp`: When message was created, enables chronological ordering
- `tokenCount`: Approximate token count for estimating API cost
- `streamingId`: Groups streamed chunks from single API call

**Validation Rules**:

- `id`: Must be non-empty UUID (v4)
- `content`: Must be non-empty string, max 4000 characters per OpenAI API
- `role`: Must be one of enum values
- `timestamp`: Must be valid Unix timestamp (0 < timestamp < now)

**Storage**: IndexedDB in Conversations database

---

### Conversation Entity

**Purpose**: Represents a complete chat session with history, metadata, and settings

**TypeScript Definition**:

```typescript
interface Conversation {
  id: string; // UUID format
  title: string; // User-visible conversation name
  messages: Message[]; // Chronologically ordered messages
  metadata: ConversationMetadata;
  settings: ConversationSettings;
}

interface ConversationMetadata {
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Last message timestamp
  messageCount: number; // Quick count without iterating
  totalTokensUsed: number; // Estimated cumulative tokens
}

interface ConversationSettings {
  modelId: string; // Selected Model ID (e.g., 'gpt-4')
  systemPrompt: string; // Custom system prompt for this conversation
  apiParameters: APIParameters; // API configuration for this conversation
}

interface APIParameters {
  temperature: number; // 0-2, affects creativity
  maxTokens?: number; // Max response length
  topP: number; // 0-1, controls diversity
  frequencyPenalty: number; // -2 to 2, reduces repetition
  presencePenalty: number; // -2 to 2, encourages new topics
}
```

**Attributes**:

- `id`: Unique conversation identifier
- `title`: Auto-generated or user-set name (e.g., "Python Help", "Creative Writing")
- `messages`: Array of Message objects, kept in insertion order
- `metadata`: Tracking info without duplicating message data
- `settings`: Full configuration snapshot for this conversation

**Validation Rules**:

- `title`: Non-empty, 1-100 characters
- `messages`: Must be valid Message array
- `metadata.messageCount`: Must equal actual messages.length
- `APIParameters.temperature`: Strictly 0-2 (OpenAI constraint)
- `APIParameters.topP`: Strictly 0-1
- `APIParameters.frequencyPenalty`: Strictly -2 to 2
- `APIParameters.presencePenalty`: Strictly -2 to 2

**State Transitions**:

- **Active** → Conversation currently being edited
- **Archived** → Conversation not actively used (optional future feature)
- **Exported** → Conversation exported to file

**Storage**: IndexedDB conversations store

---

### Model Configuration Entity

**Purpose**: Defines available LLM models and their constraints

**TypeScript Definition**:

```typescript
interface ModelConfig {
  id: string; // Unique ID (e.g., 'gpt-4')
  name: string; // Display name (e.g., 'GPT-4')
  provider: "openai"; // Provider (OpenAI for MVP)
  maxTokens: number; // Context window size
  costPer1kTokens: {
    input: number; // Cost per 1K input tokens
    output: number; // Cost per 1K output tokens
  };
  capabilities: {
    supportsStreaming: boolean; // Streaming response support
    supportsSystemPrompt: boolean; // System prompt support
  };
  constraints: APIParameterConstraints;
}

interface APIParameterConstraints {
  temperature: { min: number; max: number; default: number };
  topP: { min: number; max: number; default: number };
  frequencyPenalty: { min: number; max: number; default: number };
  presencePenalty: { min: number; max: number; default: number };
  maxTokens: { min: number; max: number };
}
```

**Predefined Models (MVP)**:

```typescript
const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  "gpt-4": {
    id: "gpt-4",
    name: "GPT-4",
    provider: "openai",
    maxTokens: 8192,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    capabilities: { supportsStreaming: true, supportsSystemPrompt: true },
    constraints: {
      /* ... */
    },
  },
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    maxTokens: 4096,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    capabilities: { supportsStreaming: true, supportsSystemPrompt: true },
    constraints: {
      /* ... */
    },
  },
};
```

**Storage**: Hardcoded in app (constants/models.ts), no persistence needed

---

### User Settings Entity

**Purpose**: Global application settings and preferences

**TypeScript Definition**:

```typescript
interface UserSettings {
  defaultModelId: string; // Default model when creating new conversation
  openaiApiKey: string; // User's OpenAI API key (sessionStorage only!)
  customSystemPrompts?: string[]; // Saved system prompt templates
  defaultAPIParameters: APIParameters; // Default params for new conversations
  uiPreferences: {
    theme: "light" | "dark"; // Future: theming support
    fontSize: "small" | "medium" | "large";
    showTokens: boolean; // Show token counts in UI
  };
  exportFormat: "json" | "markdown"; // Preferred export format
}

interface UserSettingsDefaults {
  defaultModelId: "gpt-3.5-turbo";
  defaultAPIParameters: {
    temperature: 0.7;
    topP: 1;
    frequencyPenalty: 0;
    presencePenalty: 0;
  };
  uiPreferences: {
    theme: "light";
    fontSize: "medium";
    showTokens: false;
  };
  exportFormat: "markdown";
}
```

**Validation Rules**:

- `defaultModelId`: Must exist in AVAILABLE_MODELS
- `openaiApiKey`: Non-empty string, format: sk-\* (rough validation)
- `defaultAPIParameters`: Must pass APIParameters validation
- `customSystemPrompts`: Array of non-empty strings
- `uiPreferences.fontSize`: One of enum values

**Storage**: localStorage with key `llm-chat:user-settings` (JSON serialized)

**Security Note**: API key stored in sessionStorage, NOT in UserSettings persistence

---

## Relationships & Data Flow

```
UserSettings (localStorage)
    ├─ defaultModelId → selects model from
    └─ openaiApiKey → used for all API calls

Conversation (IndexedDB)
    ├─ settings.modelId → references
    │   └─ ModelConfig (hardcoded)
    │
    └─ messages[] (array of Message)
        └─ Each Message sent to OpenAI API
            └─ API response becomes new assistant Message
```

## Storage Schema

### IndexedDB: "llm-chat"

**Store**: `conversations`

```
keyPath: 'id'
indexes:
  - 'metadata.createdAt' (ascending for sorting by date)
  - 'title' (for search)
```

**Data serialization**: Full Conversation objects stored as-is

### localStorage: Direct key-value

```
'llm-chat:user-settings' → JSON string of UserSettings
'llm-chat:current-conversation-id' → string (current active conversation)
```

## Type Safety Implementation

### Branded Types (Discriminated Unions)

```typescript
// Ensure correct message types at compile time
type UserMessage = Message & { role: "user" };
type AssistantMessage = Message & { role: "assistant" };

// Type guards for runtime safety
function isUserMessage(msg: Message): msg is UserMessage {
  return msg.role === "user";
}

function isAssistantMessage(msg: Message): msg is AssistantMessage {
  return msg.role === "assistant";
}
```

### Validation Functions

```typescript
// Runtime validation for API parameters
function validateAPIParameters(
  params: APIParameters,
  model: ModelConfig,
): string[] {
  const errors: string[] = [];

  if (params.temperature < 0 || params.temperature > 2) {
    errors.push("Temperature must be between 0 and 2");
  }
  // ... more validations

  return errors; // Empty array = valid
}
```

## Migration Strategy (Future)

If data model changes in future versions:

1. Use IndexedDB version numbering
2. Implement onupgradeneeded handler in storage layer
3. Create migration functions for schema updates
4. Maintain backward compatibility where possible

---

## Summary of Entity Relationships

| Entity        | Purpose                   | Storage                     | Lifetime                    |
| ------------- | ------------------------- | --------------------------- | --------------------------- |
| Message       | Individual chat message   | IndexedDB (in Conversation) | Lifetime of Conversation    |
| Conversation  | Chat session with history | IndexedDB                   | Until user deletes          |
| ModelConfig   | LLM configuration         | Hardcoded constants         | App lifetime (no storage)   |
| UserSettings  | Global preferences        | localStorage                | Until user clears or resets |
| APIParameters | Request configuration     | Embedded in Conversation    | Lifetime of Conversation    |

All entities use TypeScript interfaces with strict typing and validation rules for data integrity.

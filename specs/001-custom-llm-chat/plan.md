# Implementation Plan: Custom LLM Chat Interface

**Branch**: `001-custom-llm-chat` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-custom-llm-chat/spec.md`

## Summary

Build a modern React-based web application that allows users to interact with OpenAI's GPT models via a streamlined chat interface. Core MVP features include LLM model selection (GPT-4, GPT-3.5-Turbo), customizable system prompts, configurable API parameters, real-time streaming responses, and persistent conversation history stored in the browser. The application is built with React 18, Vite for fast development and builds, TypeScript for type safety, and CSS modules for scoped styling.

## Technical Context

**Language/Version**: TypeScript 5+ (compiled to ES2020)  
**Framework**: React 18+ with Vite 5+  
**Styling**: CSS Modules  
**Package Manager**: pnpm 8+  
**Storage**: Browser localStorage + IndexedDB for conversation persistence  
**Testing**: Vitest for unit tests, React Testing Library for component tests  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - modern versions)  
**Project Type**: Web Application (SPA - Single Page Application)  
**Performance Goals**:

- Initial page load: < 3 seconds (on 3G)
- Streaming response time: < 500ms latency between chunks
- Chat UI interactions: < 100ms response time
- Conversation with 50+ messages: no performance degradation

**Constraints**:

- Requires user-provided OpenAI API key
- Browser storage is single-origin (no cross-domain access)
- Conversation size limited by browser storage quota (~5-50MB depending on browser)
- Token limits depend on selected OpenAI model
- Streaming requires compatible browser with fetch streaming support

**Scale/Scope**:

- Single-user web application (no multi-user backend)
- Support for 2+ conversations per session
- Up to 50 messages per conversation in MVP (token-aware)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **PASS** - Constitution file contains only template placeholders with no project-specific constraints. This feature proceeds without architectural restrictions.

## Project Structure

### Documentation (this feature)

```text
specs/001-custom-llm-chat/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technology research & best practices)
├── data-model.md        # Phase 1 output (entity definitions & data structures)
├── quickstart.md        # Phase 1 output (setup & running instructions)
├── contracts/           # Phase 1 output (API contracts with OpenAI)
│   └── openai-api.md    # Contract documentation for OpenAI integration
├── checklists/
│   └── requirements.md   # Spec validation checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
chatgpt-clone/                    # Application root
│
├── public/                        # Static assets
│   └── index.html                # HTML entry point
│
├── src/                           # Source code
│   ├── index.tsx                 # Application entry point
│   ├── index.module.css          # Global styles
│   │
│   ├── app/
│   │   ├── App.tsx               # Main app component
│   │   ├── App.module.css
│   │   ├── store/                # Global state (Zustand/Context)
│   │   │   ├── useAppStore.ts    # App configuration & settings store
│   │   │   ├── useChatStore.ts   # Conversation & message state
│   │   │   └── index.ts          # Store exports
│   │   │
│   │   └── layout/               # Layout components
│   │       ├── MainLayout.tsx
│   │       └── MainLayout.module.css
│   │
│   ├── components/               # Reusable UI components
│   │   ├── ChatInterface/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatInterface.module.css
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageList.module.css
│   │   │   ├── InputBox.tsx
│   │   │   ├── InputBox.module.css
│   │   │   └── index.ts
│   │   │
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Sidebar.module.css
│   │   │   └── ConversationList.tsx
│   │   │
│   │   ├── Settings/
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── SettingsPanel.module.css
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── SystemPromptEditor.tsx
│   │   │   ├── ApiParametersEditor.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Button.module.css
│   │       ├── Input.tsx
│   │       ├── Input.module.css
│   │       └── index.ts
│   │
│   ├── services/                 # Business logic & APIs
│   │   ├── openai/
│   │   │   ├── openaiClient.ts   # OpenAI API wrapper
│   │   │   ├── streamChat.ts     # Streaming response handler
│   │   │   ├── types.ts          # OpenAI types
│   │   │   └── index.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── conversationStorage.ts  # localStorage/IndexedDB wrapper
│   │   │   ├── settingsStorage.ts      # Settings persistence
│   │   │   └── index.ts
│   │   │
│   │   ├── export/
│   │   │   ├── jsonExport.ts     # Export to JSON
│   │   │   ├── markdownExport.ts # Export to Markdown
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts              # Service exports
│   │
│   ├── types/                    # TypeScript types & interfaces
│   │   ├── chat.ts               # Chat-related types (Message, Conversation)
│   │   ├── settings.ts           # Settings types (UserSettings, ApiConfig)
│   │   ├── openai.ts             # OpenAI request/response types
│   │   └── index.ts              # Type exports
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useChat.ts            # Chat logic hook
│   │   ├── useSettings.ts        # Settings management hook
│   │   ├── useStreaming.ts       # Streaming response handler
│   │   └── index.ts              # Hook exports
│   │
│   ├── utils/                    # Utility functions
│   │   ├── tokenCounter.ts       # Token estimation for messages
│   │   ├── messageFormatter.ts   # Format messages for display
│   │   ├── validators.ts         # Input validation
│   │   └── index.ts              # Utility exports
│   │
│   └── constants/                # Application constants
│       ├── models.ts             # Available OpenAI models
│       ├── apiDefaults.ts        # Default API parameters
│       └── index.ts
│
├── tests/                        # Test files (mirror src structure)
│   ├── unit/
│   │   ├── services/
│   │   │   ├── openai/
│   │   │   ├── storage/
│   │   │   └── export/
│   │   ├── utils/
│   │   ├── hooks/
│   │   └── types/
│   │
│   ├── components/
│   │   ├── ChatInterface.test.tsx
│   │   ├── Settings/
│   │   └── ...
│   │
│   └── integration/
│       ├── chat-flow.test.tsx    # End-to-end chat scenarios
│       └── settings-persistence.test.tsx
│
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies & scripts
├── package-lock.json            # Dependency lock file
├── .gitignore
├── README.md                    # Project documentation
└── .env.example                 # Environment variable template
```

**Structure Decision**:
This is a web application (SPA) built with React + Vite. The structure follows:

- **Feature-based component organization** (ChatInterface, Sidebar, Settings separated by feature)
- **Service layer** for API integration and business logic (openai, storage, export)
- **Centralized type definitions** for TypeScript safety
- **CSS Modules** for scoped styling (one .module.css file per component)
- **Custom hooks** for reusable logic (useChat, useSettings, useStreaming)
- **Mirror test structure** matching source code organization
- **No Backend**: Single-origin client-side application with direct OpenAI API calls from browser

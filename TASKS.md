# Implementation Tasks: Custom LLM Chat Interface

**Project**: AI_chatroom  
**Feature**: 001-custom-llm-chat  
**Status**: Planning Phase Complete → Ready for Implementation  
**Last Updated**: 2026-03-15  
**LLM Server**: http://203.145.220.74:54023/

---

## Phase 0: Project Setup ✅ (In Progress)

- [x] Initialize Git repository
- [x] Create specification (spec.md)
- [x] Create implementation plan (plan.md)
- [x] Set up environment configuration (.env.local, .env.example)
- [ ] Initialize npm project with pnpm
- [ ] Set up Vite configuration
- [ ] Configure TypeScript
- [ ] Set up testing framework (Vitest + React Testing Library)
- [ ] Configure linting (ESLint)

## Phase 1: Core Infrastructure (Next)

### 1.1 Project Initialization

- [ ] Create `package.json` with dependencies:
  - React 18+, Vite 5+, TypeScript 5+
  - Zustand for state management
  - CSS Modules for styling
  - Testing libraries
- [ ] Create `vite.config.ts` with proper env variable loading
- [ ] Create `tsconfig.json` with ES2020 target
- [ ] Create `README.md` with project overview and setup instructions

### 1.2 Type Definitions

- [ ] Create `src/types/chat.ts` - Message, Conversation, ConversationMetadata types
- [ ] Create `src/types/settings.ts` - UserSettings, ApiConfig, ModelConfig types
- [ ] Create `src/types/openai.ts` - OpenAI request/response types
- [ ] Create `src/types/index.ts` - Export all types

### 1.3 Constants & Configuration

- [ ] Create `src/constants/models.ts` - Available OpenAI models (GPT-4, GPT-3.5-Turbo)
- [ ] Create `src/constants/apiDefaults.ts` - Default API parameters (temperature, max_tokens, etc.)
- [ ] Create `src/constants/index.ts` - Export constants

### 1.4 Storage Layer

- [ ] Create `src/services/storage/conversationStorage.ts` - localStorage/IndexedDB wrapper
- [ ] Create `src/services/storage/settingsStorage.ts` - User settings persistence
- [ ] Create `src/services/storage/index.ts` - Export storage services
- [ ] Tests for storage services

### 1.5 OpenAI Integration

- [ ] Create `src/services/openai/openaiClient.ts` - OpenAI API wrapper using fetch
- [ ] Create `src/services/openai/streamChat.ts` - Streaming response handler
- [ ] Create `src/services/openai/types.ts` - OpenAI-specific types
- [ ] Create `src/services/openai/index.ts` - Export OpenAI services
- [ ] Tests for OpenAI integration against real server
- [ ] Implement error handling and retry logic

## Phase 2: Export Features

### 2.1 Export Services

- [ ] Create `src/services/export/jsonExport.ts` - Export conversations to JSON
- [ ] Create `src/services/export/markdownExport.ts` - Export conversations to Markdown
- [ ] Create `src/services/export/index.ts` - Export services
- [ ] Tests for export functionality

## Phase 3: State Management (Zustand Stores)

### 3.1 Global Stores

- [ ] Create `src/app/store/useAppStore.ts` - App configuration store
  - LLM provider URL, API key
  - Default model selection
- [ ] Create `src/app/store/useChatStore.ts` - Chat state store
  - Current conversation
  - Message history
  - Streaming status
  - Conversation list operations
- [ ] Create `src/app/store/index.ts` - Export stores
- [ ] Tests for store logic

## Phase 4: Custom Hooks

### 4.1 Chat Logic Hooks

- [ ] Create `src/hooks/useChat.ts` - Chat operations (send message, etc.)
- [ ] Create `src/hooks/useSettings.ts` - Settings management
- [ ] Create `src/hooks/useStreaming.ts` - Streaming response handling with real-time updates
- [ ] Tests for hooks

## Phase 5: Utility Functions

### 5.1 Utilities

- [ ] Create `src/utils/tokenCounter.ts` - Token estimation for messages
- [ ] Create `src/utils/messageFormatter.ts` - Format messages for display
- [ ] Create `src/utils/validators.ts` - Input validation (API key, prompts, etc.)
- [ ] Create `src/utils/index.ts` - Export utilities
- [ ] Tests for utilities

## Phase 6: UI Components

### 6.1 Common Components

- [ ] Create `src/components/Common/Button.tsx` - Reusable button component
- [ ] Create `src/components/Common/Input.tsx` - Reusable input component
- [ ] Create `src/components/Common/Button.module.css` - Button styles
- [ ] Create `src/components/Common/Input.module.css` - Input styles
- [ ] Create `src/components/Common/index.ts` - Export common components
- [ ] Tests for common components

### 6.2 Chat Interface Components

- [ ] Create `src/components/ChatInterface/ChatInterface.tsx` - Main chat interface container
- [ ] Create `src/components/ChatInterface/MessageList.tsx` - Display messages
- [ ] Create `src/components/ChatInterface/InputBox.tsx` - User input for messages
- [ ] Create style files for chat components
- [ ] Create `src/components/ChatInterface/index.ts` - Export components
- [ ] Tests for chat components

### 6.3 Sidebar Components

- [ ] Create `src/components/Sidebar/Sidebar.tsx` - Main sidebar container
- [ ] Create `src/components/Sidebar/ConversationList.tsx` - List of conversations
- [ ] Create `src/components/Sidebar/Sidebar.module.css` - Sidebar styles
- [ ] Tests for sidebar components

### 6.4 Settings Components

- [ ] Create `src/components/Settings/SettingsPanel.tsx` - Settings container
- [ ] Create `src/components/Settings/ModelSelector.tsx` - Select LLM model
- [ ] Create `src/components/Settings/SystemPromptEditor.tsx` - Edit system prompt
- [ ] Create `src/components/Settings/ApiParametersEditor.tsx` - Configure API parameters
- [ ] Create style files for settings components
- [ ] Create `src/components/Settings/index.ts` - Export components
- [ ] Tests for settings components

## Phase 7: Layout & App Structure

### 7.1 Layout Components

- [ ] Create `src/app/layout/MainLayout.tsx` - Main app layout
- [ ] Create `src/app/layout/MainLayout.module.css` - Layout styles
- [ ] Tests for layout

### 7.2 Main App Component

- [ ] Create `src/app/App.tsx` - Root app component with routing/navigation
- [ ] Create `src/app/App.module.css` - App-level styles
- [ ] Tests for app component

### 7.3 App Entry Point

- [ ] Create `src/index.tsx` - React DOM render entry point
- [ ] Create `src/index.module.css` - Global styles
- [ ] Create `public/index.html` - HTML entry point

## Phase 8: Build & Configuration

### 8.1 Vite & Build Configuration

- [ ] Configure Vite to:
  - Load environment variables with `VITE_` prefix
  - Handle CSS Modules
  - Optimize build for production
- [ ] Create `.env.example` - Environment variable template
- [ ] Configure build scripts in package.json

### 8.2 ESLint & Code Quality

- [ ] Set up ESLint configuration
- [ ] Set up Prettier for code formatting
- [ ] Add pre-commit hooks

## Phase 9: Testing

### 9.1 Unit Tests

- [ ] Tests for all services (openaiClient, storage, export)
- [ ] Tests for all utilities (tokenCounter, validators, etc.)
- [ ] Tests for all hooks (useChat, useSettings, useStreaming)
- [ ] Tests for all components

### 9.2 Integration Tests

- [ ] End-to-end chat flow test
- [ ] Settings persistence test
- [ ] Conversation export test

### 9.3 Test Coverage

- [ ] Achieve >= 80% code coverage
- [ ] All critical paths covered

## Phase 10: Documentation & Polish

### 10.1 Documentation

- [ ] Update README.md with features, setup, and usage
- [ ] Create API documentation for OpenAI integration
- [ ] Create component documentation with examples
- [ ] Add inline code comments for complex logic

### 10.2 Performance & Optimization

- [ ] Verify < 3 second initial load on 3G
- [ ] Verify < 500ms streaming latency
- [ ] Optimize bundle size
- [ ] Profile and optimize component renders

### 10.3 Cross-browser Testing

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Verify streaming support on all browsers
- [ ] Test on mobile devices

---

## Success Criteria Checklist

- [ ] **SC-001**: Initial page load < 3 seconds on 3G
- [ ] **SC-002**: App handles 50+ messages without performance degradation
- [ ] **SC-003**: User can select between GPT-4 and GPT-3.5-Turbo
- [ ] **SC-004**: User can edit system prompt and API parameters
- [ ] **SC-005**: Conversation history persists perfectly (100% reliability)
- [ ] **SC-006**: Streaming responses display in real-time as they arrive
- [ ] **SC-007**: User can see response time and token usage
- [ ] **SC-008**: UI is intuitive with no more than 2 clicks to start chatting
- [ ] **SC-009**: Error messages guide users to resolution
- [ ] **SC-010**: Error recovery is graceful with no data loss

---

## Dependencies

### Runtime Dependencies

- react@18+
- vite@5+
- typescript@5+
- zustand (state management)

### Dev Dependencies

- vitest (unit testing)
- @testing-library/react (component testing)
- @testing-library/user-event
- eslint
- prettier
- @vitejs/plugin-react

---

## Notes

- **LLM Server**: http://203.145.220.74:54023/ (configured in .env.local)
- **API Key**: Stored in `.env.local` with `VITE_LLM_API_KEY` variable
- **Browser APIs**: Uses Fetch API with streaming support (EventSource alternative if needed)
- **No Backend**: This is a pure client-side application
- **Storage**: Uses localStorage for small data, IndexedDB for conversation history

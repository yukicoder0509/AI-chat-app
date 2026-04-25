# Phase 0 Research: Technology & Best Practices

**Date**: 2026-03-13  
**Purpose**: Validate technology choices and establish best practices for MVP implementation

## Technology Stack Validation

### React 18 + Vite

**Decision**: Use React 18 with Vite 5+ as the foundation  
**Rationale**:

- React 18 is stable, widely adopted, and has excellent ecosystem support
- Vite provides blazing-fast development experience (HMR) and optimized builds
- Strong TypeScript integration with both frameworks
- Large community with extensive libraries and UI components
- Perfect fit for single-page applications

**Alternatives Considered**:

- Vue.js: Excellent option, but React has broader ecosystem for AI/LLM tools
- Svelte: Very lightweight but smaller ecosystem for specialized components
- Next.js: Over-engineering for a client-side only app with no backend
- Plain JavaScript/TypeScript: Would require manual DOM management

**Best Practices**:

1. **Component structure**: Break UI into small, composable, single-responsibility components
2. **State management**: Use Zustand (lightweight alternative to Redux/Context) for global state
3. **Directory organization**: Feature-based folder structure (ChatInterface/, Settings/, etc.)
4. **Performance**: Use lazy loading with React.lazy() for routes when app grows

### TypeScript 5+

**Decision**: Enforce strict TypeScript for all project code  
**Rationale**:

- Prevents runtime errors through static type checking
- Self-documenting code through type annotations
- Excellent IDE support with autocomplete and refactoring
- Catches bugs early in development cycle
- Critical for maintainability in growing codebases

**Alternatives Considered**:

- JavaScript + JSDoc: Lose static type safety and IDE tooling
- Flow: Outdated, smaller community than TypeScript

**Best Practices**:

1. **Strict mode**: Set `strict: true` in tsconfig.json
2. **No implicit any**: Disable `noImplicitAny: false`
3. **Type definitions**: Create explicit types for all major entities (Message, Conversation, Settings)
4. **Avoid `any`**: Use `unknown` with type guards when type is truly unknown
5. **Branded types**: Use discriminated unions for Message types (user vs assistant)

### CSS Modules

**Decision**: Use CSS Modules for all component styling  
**Rationale**:

- Automatic scoping prevents naming conflicts
- No need for BEM conventions or naming discipline
- Clear component-to-styles association
- Works perfectly with TypeScript
- Zero runtime overhead compared to CSS-in-JS

**Alternatives Considered**:

- Tailwind CSS: Powerful but creates large HTML files with utility classes
- Styled-components: Adds JavaScript runtime overhead
- Sass/SCSS: Possible, but less encapsulation than CSS Modules
- Plain CSS: No scoping, naming conflicts at scale

**Best Practices**:

1. **Naming**: Use `Component.module.css` pattern for consistency
2. **Organization**: Keep styles close to components
3. **Reusable utilities**: Create shared CSS modules for common patterns
4. **CSS custom properties**: Use CSS variables for theming and color schemes
5. **Mobile first**: Write mobile styles by default, add desktop with media queries

## Browser API Research

### LocalStorage vs IndexedDB for Conversation Storage

**Decision**: Use IndexedDB primary with localStorage fallback  
**Rationale**:

- IndexedDB: Larger storage quota (50MB+), better for structured data, supports large conversations
- localStorage: Simpler API, sufficient for settings (<100KB)
- Combined approach: Best of both worlds

**Implementation Strategy**:

- Conversations → IndexedDB (large, structured data)
- Settings (model, system prompt, API params) → localStorage (small, simple JSON)
- Feature detection: Check support and gracefully degrade

### Fetch API with Streaming

**Decision**: Use native Fetch API with Response.body.getReader() for streaming  
**Rationale**:

- Native browser API, no external dependencies
- Works across all modern browsers
- Built-in error handling and abort capabilities
- Provides real-time progressive text rendering

**Best Practices**:

1. **Error handling**: Catch and handle network errors gracefully
2. **Abort control**: Allow user to stop streaming mid-response
3. **Chunk handling**: Process chunks incrementally for responsive UI
4. **Encoding**: Handle UTF-8 encoded text chunks correctly

## API Integration

### OpenAI API Communication

**Decision**: Direct API calls from browser with user-provided API key  
**Rationale**:

- Simple architecture, no backend needed for MVP
- User controls their API key (not stored on server)
- Lower operational complexity

**Implementation Considerations**:

1. **API Key Storage**:
   - Store in sessionStorage (cleared on tab close) for security
   - OR add option for user to enter on each session
   - NEVER store in localStorage persistence
2. **CORS**: Note that OpenAI API supports CORS from browser applications
3. **Error handling**: Handle rate limits, quota exceeded, invalid keys gracefully

**Future Enhancement**: If scaling beyond MVP, add backend proxy to:

- Handle API key securely
- Implement rate limiting per user
- Add request logging and monitoring

## State Management

### Zustand for Global State

**Decision**: Use Zustand for chat state and settings  
**Pattern**: Two separate stores

- `useChatStore` - Current messages, current conversation ID, loading state
- `useAppStore` - User settings, model selection, API configuration

**Benefits**:

- Minimal boilerplate compared to Redux
- Excellent TypeScript support
- Small bundle size (~1KB)
- Devtools available via middleware

**Alternative**: React Context API - Sufficient but more verbose for complex state

## Testing Strategy

### Vitest + React Testing Library

**Framework Choice**: Vitest (modern alternative to Jest)  
**Rationale**:

- Better performance (10x faster than Jest)
- Native ESM support
- Perfect TypeScript integration
- Component tests use React Testing Library (user-centric testing)

**Testing Scope**:

1. **Unit tests**: Utility functions, type safety, validators
2. **Component tests**: Individual components in isolation
3. **Integration tests**: Chat flow end-to-end, storage persistence
4. **Coverage goal**: 80%+ for MVP

## Performance Considerations

### Bundle Size Optimization

**Target**: < 300KB (gzipped)  
**Strategies**:

1. Use dynamic imports for lazy-loaded components
2. Tree-shake unused code with Vite
3. No moment.js (use native Date or date-fns)
4. Minimize dependencies (prefer small, focused libraries)

### Runtime Performance

**Streaming optimizations**:

1. Virtualization: If message list grows, use react-window for virtualization
2. Memoization: Use React.memo() for message list items
3. Code splitting: Load heavy models selection UI on demand

## Security & Privacy

### API Key Handling

⚠️ **Critical**:

- Users provide their own OpenAI API key
- Key stored in sessionStorage only (not persistent)
- Key sent directly from browser to OpenAI (no CORS proxy needed)
- Consider browser extension/native app for long-term usage

### Input Validation

1. System prompt: Allow any text (user responsibility)
2. API parameters: Validate ranges (temp 0-2, top_p 0-1, etc.)
3. Messages: Trim whitespace, validate encoding
4. Token counting: Use OpenAI's tokenizer library (cl100k_base)

## Deployment & Build

### Vite Build Configuration

**Output**:

- SPA served from single HTML file
- All assets bundled with content hashing for cache busting
- Source maps for debugging (optional in production)

**Deployment Options**:

- GitHub Pages (free, simple)
- Vercel (free tier, excellent DX)
- Netlify (free tier, similar to Vercel)
- Self-hosted (any static file server)

### Environment Variables

**.env files**:

```
VITE_API_BASE_URL=https://api.openai.com/v1  # OpenAI API endpoint
VITE_APP_VERSION=0.1.0                       # For debugging
```

Note: API key is NOT stored in .env (user provides at runtime)

## Development Workflow

### Hot Module Replacement (HMR)

Vite's HMR ensures:

- Instant feedback during development
- State preservation when possible
- Smooth development experience

### Code Quality Tools

1. **ESLint**: Type-aware linting for React + TypeScript
2. **Prettier**: Automatic code formatting
3. **TypeScript**: Strict type checking
4. **Git hooks** (husky): Pre-commit linting and formatting

---

## Resolved Clarifications

All technical questions resolved. Implementation can proceed to Phase 1 Design.

✅ Framework: React 18 with Vite 5  
✅ Language: TypeScript 5+ (strict mode)  
✅ Styling: CSS Modules  
✅ Storage: IndexedDB (conversations) + localStorage (settings)  
✅ API Integration: Direct fetch to OpenAI API  
✅ State Management: Zustand  
✅ Testing: Vitest + React Testing Library  
✅ Performance Target: <300KB gzipped, <3s initial load

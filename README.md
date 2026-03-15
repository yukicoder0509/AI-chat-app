# AI Chatroom - Custom LLM Chat Interface

A modern React-based web application for interacting with LLM models via OpenAI's API. This chatroom provides a streamlined interface for real-time conversations with customizable system prompts, model selection, and persistent conversation history.

## Features

- **Model Selection**: Switch between GPT-4 and GPT-3.5-Turbo
- **System Prompt Customization**: Define custom system prompts for different use cases
- **Streaming Responses**: Real-time response streaming with visual feedback
- **Conversation Memory**: Browser-based persistence of conversation history
- **API Parameters**: Configure temperature, max tokens, and other OpenAI parameters
- **Export Conversations**: Download conversations in JSON and Markdown formats

## Quick Start

### Prerequisites

- Node.js v18 or higher
- pnpm v8 or higher
- OpenAI API key (stored in `.env.local`)

### Installation

```bash
# Install dependencies
pnpm install

# Create local environment file
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key
# VITE_LLM_API_KEY=your_key_here

# Start development server
pnpm run dev
```

The app will be available at `http://localhost:5173`

## Development

```bash
# Start development server with hot module replacement
pnpm run dev

# Run tests
pnpm run test

# Run tests in UI mode
pnpm run test:ui

# Run tests with coverage
pnpm run test:coverage

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Lint code
pnpm run lint
```

## Project Structure

See [TASKS.md](TASKS.md) for the complete implementation roadmap and [specs/001-custom-llm-chat/](specs/001-custom-llm-chat/) for detailed specifications and planning documents.

```
src/
├── app/                      # Application root components
│   ├── App.tsx              # Main app component
│   ├── layout/              # Layout components
│   └── store/               # Global state (Zustand)
├── components/              # Reusable UI components
│   ├── ChatInterface/       # Chat UI components
│   ├── Sidebar/             # Navigation and conversation list
│   ├── Settings/            # Configuration panels
│   └── Common/              # Button, Input, etc.
├── services/                # Business logic and APIs
│   ├── openai/              # OpenAI API integration
│   ├── storage/             # LocalStorage/IndexedDB
│   └── export/              # JSON/Markdown export
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
├── constants/               # Application constants
└── index.tsx               # Entry point
```

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
VITE_LLM_API_URL=http://203.145.220.74:54023
VITE_LLM_API_KEY=your_api_key_here
```

See [.env.example](.env.example) for all available options.

## Technology Stack

- **Frontend**: React 18+, TypeScript 5+
- **Build Tool**: Vite 5+
- **State Management**: Zustand
- **Styling**: CSS Modules
- **Testing**: Vitest, React Testing Library
- **Linting**: ESLint, Prettier

## Configuration

- **Target Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Performance Goals**:
  - Initial load: < 3 seconds (3G)
  - Streaming latency: < 500ms
  - UI response: < 100ms
- **TypeScript**: Strict mode, ES2020 target

## Testing Strategy

- **Unit Tests**: Services, utilities, and hooks use Vitest
- **Component Tests**: React components use React Testing Library
- **Integration Tests**: End-to-end chat flows
- **Coverage Target**: >= 80%

## Build & Deployment

```bash
# Build for production
pnpm run build

# Output directory: dist/
# Ready to deploy to any static hosting service
```

## Available Scripts

- `pnpm run dev` - Start dev server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run test` - Run tests
- `pnpm run test:ui` - Run tests with UI
- `pnpm run test:coverage` - Generate coverage report
- `pnpm run lint` - Lint code

## License

MIT

## Support & Documentation

For more details, see:

- [Implementation Plan](specs/001-custom-llm-chat/plan.md)
- [Feature Specification](specs/001-custom-llm-chat/spec.md)
- [Implementation Tasks](TASKS.md)
- [OpenAI API Documentation](specs/001-custom-llm-chat/contracts/openai-api.md)

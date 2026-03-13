# Quick Start: Development Setup & Running the App

**Purpose**: Get the application running locally for development  
**Time**: 5-10 minutes  
**Requirements**: Node.js 18+, pnpm 8+

## Prerequisites

### System Requirements

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Git**: To clone the repository

### Verify Installation

```bash
node --version     # Should output v18.x.x or higher
pnpm --version     # Should output 8.x.x or higher
```

## Project Setup

### Step 1: Initialize the Project

```bash
# Navigate to workspace
cd /Users/yanghaocheng/Documents/交大/IntroToGenAI/AI_chatroom

# Create the app directory
mkdir -p apps/chatgpt-clone
cd apps/chatgpt-clone

# Initialize package.json with Vite + React template
pnpm create vite@latest . -- --template react-ts

# Install dependencies
pnpm install
```

### Step 2: Install Additional Dependencies

```bash
# State management
pnpm add zustand

# OpenAI client (option: use their official SDK or direct fetch)
pnpm add openai

# Token counting (for accurate cost estimation)
pnpm add js-tiktoken

# Development utilities
pnpm add -D @types/node @types/react @types/react-dom

# Optional: ESLint + Prettier for code quality
pnpm add -D eslint prettier eslint-config-prettier
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
```

### Step 3: Verify Installation

```bash
pnpm list zustand openai js-tiktoken
# All should show in dependencies
```

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@hooks/*": ["src/hooks/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
    },
  },
  server: {
    port: 5173,
    open: true,
    hmr: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
  },
  define: {
    "process.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL || "https://api.openai.com/v1",
    ),
  },
});
```

### Environment Variables (`.env.local`)

```
# Create this file in project root
# DO NOT commit this file to git (add to .gitignore)

VITE_API_BASE_URL=https://api.openai.com/v1
VITE_APP_VERSION=0.1.0

# Optional: Debug mode
VITE_DEBUG=false
```

### ESLint Configuration (`.eslintrc.json`)

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["react", "react-hooks", "@typescript-eslint"],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Running the Application

### Development Mode

```bash
# Start Vite dev server with hot reload
pnpm dev

# Server will open at http://localhost:5173
# Any file changes will automatically reload
```

**Output**:

```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Building for Production

```bash
# Create optimized build
pnpm build

# Output will be in 'dist/' directory
# Test build locally
pnpm preview
```

### Running Tests

```bash
# Install test dependencies (if not already installed)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

### Linting & Formatting

```bash
# Check for linting errors
pnpm lint

# Fix linting errors automatically
pnpm lint:fix

# Format code with Prettier
pnpm format
```

## Initial Folder Structure

After setup, you should have:

```
apps/chatgpt-clone/
├── public/
│   └── vite.svg
├── src/
│   ├── index.tsx
│   ├── index.module.css
│   ├── App.tsx
│   ├── App.module.css
│   ├── components/
│   ├── services/
│   ├── types/
│   ├── hooks/
│   ├── utils/
│   └── constants/
├── tests/
│   └── (empty, will be populated)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.local           # ← Create this file
├── .eslintrc.json       # ← Create this file
├── .prettierrc
└── .gitignore
```

## First Steps After Setup

### 1. Create Core Directories

```bash
# From apps/chatgpt-clone/
mkdir -p src/components/ChatInterface
mkdir -p src/components/Sidebar
mkdir -p src/components/Settings
mkdir -p src/components/Common
mkdir -p src/services/openai
mkdir -p src/services/storage
mkdir -p src/services/export
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/constants
mkdir -p src/app
mkdir -p tests/unit/services
mkdir -p tests/components
mkdir -p tests/integration
```

### 2. Create Initial Global Store

`src/app/store/useAppStore.ts`:

```typescript
import { create } from "zustand";

interface AppStore {
  // App-level state
  isLoading: boolean;
  error: string | null;

  // Settings
  apiKey: string;
  selectedModel: string;

  // Actions
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isLoading: false,
  error: null,
  apiKey: "",
  selectedModel: "gpt-3.5-turbo",

  setApiKey: (apiKey) => set({ apiKey }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setError: (error) => set({ error }),
}));
```

### 3. Update `src/App.tsx`

```typescript
import React from 'react';
import { useAppStore } from './app/store/useAppStore';
import styles from './App.module.css';

export const App: React.FC = () => {
  const { apiKey, selectedModel, setApiKey } = useAppStore();

  if (!apiKey) {
    return (
      <div className={styles.setupScreen}>
        <h1>Chat with OpenAI</h1>
        <input
          type="password"
          placeholder="Enter your OpenAI API key"
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <h1>Chat Interface</h1>
      <p>Model: {selectedModel}</p>
      {/* Main chat UI will go here */}
    </div>
  );
};
```

### 4. Install Additional Tools

```bash
# Git hooks for pre-commit checks
pnpm add -D husky lint-staged
pnpm exec husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
pnpm lint:fix
pnpm format
git add -A
EOF
chmod +x .husky/pre-commit
```

## Troubleshooting

### Common Issues

**Issue**: Module not found errors

```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue**: Port 5173 already in use

```bash
# Solution: Use different port
pnpm dev -- --port 5174
```

**Issue**: TypeScript errors in IDE

```bash
# Solution: Reload TypeScript server in VSCode
Cmd+Shift+P → "TypeScript: Reload Projects"
```

**Issue**: CSS Modules not working

```bash
# Verify Vite config includes CSS module support (it's default)
# Make sure files are named *.module.css not *.css
```

## Next Steps

After initial setup:

1. **Implement API Layer**: Create `src/services/openai/openaiClient.ts`
2. **Build Chat Component**: `src/components/ChatInterface/ChatInterface.tsx`
3. **Add Storage**: `src/services/storage/conversationStorage.ts`
4. **Create Types**: `src/types/chat.ts`, `src/types/settings.ts`
5. **Add Tests**: Start with unit tests for services

## Scripts Reference

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src tests --ext .ts,.tsx",
    "lint:fix": "pnpm lint -- --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx,css}' 'tests/**/*.{ts,tsx}'",
    "type-check": "tsc --noEmit"
  }
}
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/chat/create)
- [Zustand Documentation](https://zustand-demo.vercel.app/)
- [CSS Modules](https://github.com/css-modules/css-modules)

---

## Development Environment Setup Complete ✅

Your local development environment is now ready. Start the dev server with `pnpm dev` and begin building the chat interface!

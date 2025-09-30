# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [State Management](#state-management)
- [Database Schema](#database-schema)
- [Key Development Patterns](#key-development-patterns)
- [Common Issues & Solutions](#common-issues--solutions)
- [WARP-Specific Tips](#warp-specific-tips)

## Project Overview

ShimmyServe is a comprehensive, professional-grade Electron desktop application that provides a modern graphical interface for managing and interacting with the [Shimmy](https://github.com/Michael-A-Kuykendall/shimmy) LLM inference server. Built with Electron, React, and TypeScript, it offers enterprise-level features including AI-powered chat, knowledge base management, system monitoring, and advanced automation.

### Key Features
- **Server Management** - Complete lifecycle management of Shimmy servers
- **Model Management** - Load, unload, and configure AI models with hot-swapping
- **Real-time Monitoring** - System metrics, performance analytics, and health checks
- **AI Chat Interface** - Interactive conversations with Shimmer AI agent
- **Knowledge Base** - Document management with vector search and RAG integration
- **Terminal Console** - Built-in terminal with command history and themes
- **User Management** - Role-based access control with admin panel

## Technology Stack

### Core Technologies
| Technology | Version | Purpose | Configuration |
|-----------|---------|---------|---------------|
| **Electron** | Latest | Cross-platform desktop framework | `electron/main.ts`, `electron/preload.ts` |
| **React** | 18.2.0 | UI library with hooks | `src/components/`, `src/pages/` |
| **TypeScript** | 5.2.2 | Type safety and developer experience | `tsconfig.json`, `tsconfig.node.json` |
| **Vite** | 5.0.0 | Build tool and dev server | `vite.config.ts` |
| **Vitest** | Latest | Unit and integration testing | `vitest.config.ts` |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework | `tailwind.config.js` |
| **Zustand** | 5.0.8 | State management with persistence | `src/stores/` |
| **Drizzle ORM** | 0.44.5 | TypeScript ORM for SQLite | `drizzle.config.ts`, `src/lib/db/` |
| **SQLite** | Via better-sqlite3 | Local database | `./data/shimmy-serve.db` |
| **Framer Motion** | 12.23.22 | Animations and transitions | Component-level |

### Build & Development Tools
- **PostCSS** with Tailwind CSS for styling
- **ESLint** + **TypeScript** for code quality
- **Better SQLite3** for database operations
- **Winston** for logging infrastructure
- **Lucide React** for consistent iconography

## Architecture

### Application Structure
```
ShimmyServe/
├── src/                          # React renderer process
│   ├── components/               # Reusable UI components
│   │   ├── ChatInterface.tsx     # AI chat interface
│   │   ├── Dashboard.tsx         # System overview dashboard
│   │   ├── KnowledgeBase.tsx     # Document management
│   │   ├── Terminal.tsx          # Built-in terminal
│   │   └── __tests__/            # Component tests
│   ├── pages/                    # Full page components
│   ├── stores/                   # Zustand state management
│   │   ├── authStore.ts          # User authentication & permissions
│   │   ├── chatStore.ts          # Chat sessions & AI interactions
│   │   ├── knowledgeStore.ts     # Document & vector search
│   │   ├── shimmyStore.ts        # Shimmy server management
│   │   └── systemStore.ts        # System monitoring & logs
│   ├── lib/                      # Utility functions & services
│   │   ├── db/                   # Database schema & operations
│   │   ├── auth/                 # Authentication services
│   │   ├── shimmy/               # Shimmy server integration
│   │   ├── knowledge/            # Vector search & RAG
│   │   └── terminal/             # Terminal emulation
│   └── test/                     # Test utilities & setup
├── electron/                     # Electron main process
│   ├── main.ts                   # Main process entry point
│   └── preload.ts                # Preload scripts for IPC
├── docs/                         # Documentation
├── public/                       # Static assets
└── dist/                         # Build output
```

### Process Communication
The application uses Electron's IPC (Inter-Process Communication) patterns:

1. **Main Process** (`electron/main.ts`):
   - Window management and lifecycle
   - File system operations
   - Shimmy server process management
   - System-level APIs

2. **Renderer Process** (`src/`):
   - React application UI
   - State management with Zustand
   - User interactions and business logic

3. **Preload Script** (`electron/preload.ts`):
   - Secure bridge between main and renderer
   - Exposes safe APIs via `window.electronAPI`

## Development Commands

### Primary Development
```bash
# Start development server (renderer + main process)
npm run dev

# Start renderer only (for UI development)
vite

# Start Electron with hot reload
npm run electron-dev

# Build for production
npm run build

# Package Electron app for distribution
npm run electron-pack
```

### Testing Commands
```bash
# Run all tests in watch mode
npm run test

# Run tests once with coverage
npm run test:coverage

# Run specific test file
npm run test -- ChatInterface.test.tsx

# Run tests matching pattern
npm run test -- --grep "authentication"
```

### Database Commands
```bash
# Generate database migration
npx drizzle-kit generate:sqlite

# Push schema to database
npx drizzle-kit push:sqlite

# View database with Drizzle Studio
npx drizzle-kit studio
```

## Testing

### Testing Framework
- **Vitest** for unit and integration tests
- **@testing-library/react** for component testing
- **jsdom** environment for DOM simulation
- **@testing-library/jest-dom** matchers

### Test File Structure
```
src/
├── components/__tests__/         # Component tests
├── stores/__tests__/            # Store tests
├── lib/__tests__/               # Utility tests
└── test/
    ├── setup.ts                 # Global test setup
    └── utils.tsx               # Test utilities
```

### Test Patterns
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import { useAuthStore } from '../../stores/authStore'

// Mock stores
vi.mock('../../stores/authStore')

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## State Management

### Zustand Stores Architecture

**Authentication Store** (`authStore.ts`):
- User management and role-based permissions
- Session handling with JWT-like tokens
- Permission checking utilities

**Chat Store** (`chatStore.ts`):
- Chat session management
- AI message generation via Shimmy API
- RAG integration with knowledge base

**Knowledge Store** (`knowledgeStore.ts`):
- Document upload and management
- Vector embeddings and semantic search
- Document categorization and tagging

**System Store** (`systemStore.ts`):
- System monitoring and metrics
- Log aggregation and filtering
- Real-time status updates

**Shimmy Store** (`shimmyStore.ts`):
- Shimmy server lifecycle management
- Model loading and configuration
- Server status monitoring

### Store Usage Pattern
```typescript
import { useAuthStore } from '@/stores/authStore'

const MyComponent = () => {
  const { currentUser, login, logout } = useAuthStore()
  
  const handleLogin = async () => {
    const result = await login(username, password)
    if (result.success) {
      // Handle success
    }
  }
  
  return (
    <div>
      {currentUser ? (
        <span>Welcome, {currentUser.username}</span>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

## Database Schema

### Key Tables (Drizzle ORM)
Located in `src/lib/db/schema.ts`:

- **users** - User accounts with role-based permissions
- **sessions** - User session management
- **serverConfigs** - Shimmy server configurations
- **conversations** - Chat conversation metadata
- **messages** - Individual chat messages
- **documents** - Knowledge base documents
- **embeddings** - Vector embeddings for RAG
- **logs** - Application and system logs
- **metrics** - System performance metrics
- **terminalSessions** - Terminal session tracking
- **apiKeys** - External service API keys

### Database Connection
```typescript
// Database is automatically initialized in main process
// Accessed via Drizzle ORM in lib/db/index.ts
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const allUsers = await db.select().from(users)
```

## Key Development Patterns

### Component Structure
```typescript
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'

interface ComponentProps {
  title: string
  onAction?: () => void
}

export default function Component({ title, onAction }: ComponentProps) {
  const { canAccessFeature } = useAuthStore()
  
  if (!canAccessFeature('feature-name')) {
    return <AccessDenied />
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-gray-900 rounded-lg"
    >
      {/* Component content */}
    </motion.div>
  )
}
```

### Electron IPC Communication
```typescript
// In main process (electron/main.ts)
ipcMain.handle('shimmy:start', async () => {
  return await startShimmyServer()
})

// In renderer (via preload.ts)
const result = await window.electronAPI.shimmy.start()
```

### Error Handling Pattern
```typescript
try {
  const result = await riskyOperation()
  if (result.success) {
    // Handle success
  } else {
    throw new Error(result.error)
  }
} catch (error) {
  console.error('Operation failed:', error)
  // Update UI state to show error
  setError(error instanceof Error ? error.message : 'Unknown error')
}
```

## Common Issues & Solutions

### Electron Development Issues

**Hot Reload Not Working:**
```bash
# Ensure both processes are running
npm run electron-dev  # This starts both Vite dev server and Electron
```

**IPC Communication Failures:**
- Always use the preload script for secure communication
- Check that `contextIsolation: true` in main process
- Verify API methods are properly exposed in preload script

**Database Connection Issues:**
```typescript
// Database file is created in ./data/ directory
// Ensure directory exists and has write permissions
```

### Build Issues

**TypeScript Compilation Errors:**
- Check path aliases in `tsconfig.json` match `vite.config.ts`
- Ensure all imports use proper TypeScript extensions

**SQLite Binary Issues:**
```bash
# Rebuild native modules for Electron
npm rebuild --arch=x64
```

## WARP-Specific Tips

### Working with Electron Applications
1. **Two Process Architecture**: Always consider which process (main/renderer) your changes affect
2. **Security Context**: Use preload scripts for safe IPC communication
3. **Development vs Production**: Many Electron behaviors differ between dev and production builds

### State Management Best Practices
1. **Store Organization**: Each store handles a specific domain (auth, chat, system, etc.)
2. **Persistence**: Stores use Zustand persist middleware for data retention
3. **Type Safety**: All stores are fully typed with TypeScript interfaces

### Database Operations
1. **Drizzle ORM**: Use the schema-based approach for all database operations
2. **Migrations**: Always generate migrations for schema changes
3. **SQLite Location**: Database file is in `./data/shimmy-serve.db`

### Testing Considerations
1. **Mock Electron APIs**: Use provided mocks in test setup
2. **Store Testing**: Mock stores at the module level for component tests
3. **Async Operations**: Always use `waitFor` for async state updates

### AI Integration Patterns
1. **Shimmy Server**: Communication goes through Electron IPC to main process
2. **RAG Implementation**: Knowledge base provides context for AI responses
3. **Error Handling**: AI operations should gracefully handle server unavailability

### Performance Considerations
1. **Vector Search**: Embedding operations can be CPU intensive
2. **Real-time Updates**: Use WebSocket connections for live data
3. **Memory Management**: Clean up subscriptions and listeners properly

### Security Notes
1. **API Keys**: Stored encrypted in database, never in source code
2. **User Authentication**: JWT-like token system with expiry
3. **File Access**: All file operations go through secure Electron APIs

---

**Last Updated**: Based on codebase analysis as of project completion
**Technology Stack**: Electron 27, React 18, TypeScript 5, Vite 5, Drizzle ORM 0.44
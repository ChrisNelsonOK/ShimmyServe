# ShimmyServe API Documentation

This document describes the internal APIs and interfaces used within ShimmyServe for developers who want to understand the architecture or contribute to the project.

## 🏗️ Architecture Overview

ShimmyServe uses a layered architecture with clear separation between the UI, business logic, and data layers:

```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  React Components + Framer Motion      │
├─────────────────────────────────────────┤
│           State Management              │
│        Zustand Stores + Hooks          │
├─────────────────────────────────────────┤
│            Service Layer                │
│     API Clients + Database + Utils     │
├─────────────────────────────────────────┤
│           Platform Layer                │
│      Electron IPC + Node.js APIs       │
└─────────────────────────────────────────┘
```

## 📦 Store APIs

### AuthStore

Manages user authentication and authorization.

```typescript
interface AuthStore {
  // State
  user: User | null
  isAuthenticated: boolean
  users: User[]
  permissions: Record<string, boolean>
  sessionExpiry: Date | null
  lastActivity: Date

  // Actions
  login(username: string, password: string): Promise<LoginResult>
  logout(): void
  refreshSession(): Promise<boolean>
  createUser(userData: CreateUserData): Promise<CreateUserResult>
  updateUser(userId: string, updates: Partial<User>): Promise<UpdateUserResult>
  deleteUser(userId: string): Promise<DeleteUserResult>
  loadAllUsers(): Promise<void>
  hasPermission(permission: string): boolean
  canAccessFeature(feature: string): boolean
  updateLastActivity(): void
  isSessionExpired(): boolean
  initializeAuth(): Promise<void>
}
```

**Usage Example:**
```typescript
import { useAuthStore } from '@/stores/authStore'

const { user, login, hasPermission } = useAuthStore()

// Login user
const result = await login('admin', 'password')
if (result.success) {
  console.log('Logged in as:', result.user.username)
}

// Check permissions
if (hasPermission('user-management')) {
  // Show admin features
}
```

### ChatStore

Manages AI conversations and chat sessions.

```typescript
interface ChatStore {
  // State
  sessions: ChatSession[]
  activeSessionId: string | null
  currentMessage: string
  isGenerating: boolean
  ragEnabled: boolean
  ragResults: RAGResult[]

  // Actions
  createSession(title?: string): string
  deleteSession(sessionId: string): void
  switchSession(sessionId: string): void
  sendMessage(content: string, sessionId?: string): Promise<void>
  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>, sessionId?: string): void
  editMessage(messageId: string, content: string, sessionId?: string): void
  deleteMessage(messageId: string, sessionId?: string): void
  regenerateMessage(messageId: string, sessionId?: string): Promise<void>
  searchKnowledgeBase(query: string): Promise<void>
  exportSession(sessionId: string): string
  importSession(data: string): Promise<ImportResult>
}
```

**Usage Example:**
```typescript
import { useChatStore } from '@/stores/chatStore'

const { sessions, createSession, sendMessage } = useChatStore()

// Create new chat session
const sessionId = createSession('My Chat')

// Send message
await sendMessage('Hello, AI!', sessionId)
```

### SystemStore

Manages system information and Shimmy server integration.

```typescript
interface SystemStore {
  // State
  systemInfo: SystemInfo | null
  shimmyStatus: ShimmyStatus | null
  models: Model[]
  isConnected: boolean
  connectionError: string | null

  // Actions
  fetchSystemInfo(): Promise<void>
  fetchShimmyStatus(): Promise<void>
  loadModels(): Promise<void>
  loadModel(modelId: string): Promise<void>
  unloadModel(modelId: string): Promise<void>
  startServer(): Promise<void>
  stopServer(): Promise<void>
  restartServer(): Promise<void>
  testConnection(url: string): Promise<boolean>
}
```

### KnowledgeStore

Manages document storage and vector search.

```typescript
interface KnowledgeStore {
  // State
  documents: Document[]
  searchResults: SearchResult[]
  isUploading: boolean
  filters: DocumentFilters

  // Actions
  loadDocuments(): Promise<void>
  uploadDocument(file: File): Promise<void>
  deleteDocument(documentId: string): Promise<void>
  searchDocuments(query: string, useSemanticSearch?: boolean): Promise<void>
  generateSummary(documentId: string): Promise<string>
  buildKnowledgeGraph(): Promise<KnowledgeGraph>
  applyFilters(filters: DocumentFilters): void
}
```

## 🔌 API Clients

### ShimmyAPIClient

Handles communication with the Shimmy server.

```typescript
class ShimmyAPIClient {
  constructor(baseUrl: string, apiKey?: string)

  // Server management
  async getStatus(): Promise<ServerStatus>
  async startServer(): Promise<void>
  async stopServer(): Promise<void>
  async restartServer(): Promise<void>

  // Model management
  async getModels(): Promise<Model[]>
  async loadModel(modelId: string): Promise<void>
  async unloadModel(modelId: string): Promise<void>
  async getModelInfo(modelId: string): Promise<ModelInfo>

  // Inference
  async generateText(request: GenerateRequest): Promise<GenerateResponse>
  async streamGenerate(request: GenerateRequest): AsyncIterable<GenerateChunk>

  // Configuration
  async getConfig(): Promise<ServerConfig>
  async updateConfig(config: Partial<ServerConfig>): Promise<void>

  // Metrics
  async getMetrics(): Promise<ServerMetrics>
  async getLogs(options?: LogOptions): Promise<LogEntry[]>
}
```

**Usage Example:**
```typescript
import { ShimmyAPIClient } from '@/lib/api/shimmy'

const client = new ShimmyAPIClient('http://localhost:8080')

// Check server status
const status = await client.getStatus()
console.log('Server status:', status.status)

// Generate text
const response = await client.generateText({
  prompt: 'Hello, world!',
  model: 'llama-2-7b-chat',
  max_tokens: 100
})
console.log('Generated:', response.text)
```

### DatabaseClient

Manages SQLite database operations using Drizzle ORM.

```typescript
class DatabaseClient {
  constructor(dbPath: string)

  // Generic operations
  async query<T>(sql: string, params?: any[]): Promise<T[]>
  async execute(sql: string, params?: any[]): Promise<void>
  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>

  // Schema management
  async migrate(): Promise<void>
  async reset(): Promise<void>
  async backup(path: string): Promise<void>
  async restore(path: string): Promise<void>

  // Specific operations
  async insertLog(entry: LogEntry): Promise<void>
  async getLogs(options: LogQueryOptions): Promise<LogEntry[]>
  async insertDocument(document: Document): Promise<void>
  async getDocuments(filters?: DocumentFilters): Promise<Document[]>
}
```

## 🎣 Custom Hooks

### useSystem

Hook for system information and server management.

```typescript
function useSystem() {
  return {
    systemInfo: SystemInfo | null
    shimmyStatus: ShimmyStatus | null
    isConnected: boolean
    connectionError: string | null
    
    fetchSystemInfo: () => Promise<void>
    fetchShimmyStatus: () => Promise<void>
    startServer: () => Promise<void>
    stopServer: () => Promise<void>
    restartServer: () => Promise<void>
  }
}
```

### useModels

Hook for model management.

```typescript
function useModels() {
  return {
    models: Model[]
    loadedModels: Model[]
    isLoading: boolean
    
    loadModels: () => Promise<void>
    loadModel: (modelId: string) => Promise<void>
    unloadModel: (modelId: string) => Promise<void>
    downloadModel: (modelUrl: string) => Promise<void>
  }
}
```

### useRealTimeData

Hook for real-time data streaming.

```typescript
function useRealTimeData<T>(
  endpoint: string,
  interval?: number
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}
```

## 🔧 Utility APIs

### Logger

Centralized logging system.

```typescript
interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
  
  setLevel(level: LogLevel): void
  addTransport(transport: LogTransport): void
  removeTransport(name: string): void
}

// Usage
import logger from '@/lib/logging'

logger.info('User logged in', { userId: user.id })
logger.error('Failed to load model', { modelId, error })
```

### Configuration Manager

Manages application configuration.

```typescript
interface ConfigManager {
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: any): void
  has(key: string): boolean
  delete(key: string): void
  
  load(): Promise<void>
  save(): Promise<void>
  reset(): void
  
  watch(key: string, callback: (value: any) => void): () => void
}

// Usage
import { config } from '@/lib/config'

const serverUrl = config.get('shimmy.serverUrl', 'http://localhost:8080')
config.set('ui.theme', 'dark')
```

### Event System

Application-wide event system.

```typescript
interface EventEmitter {
  on(event: string, listener: Function): void
  off(event: string, listener: Function): void
  emit(event: string, ...args: any[]): void
  once(event: string, listener: Function): void
}

// Usage
import { events } from '@/lib/events'

events.on('model:loaded', (model) => {
  console.log('Model loaded:', model.name)
})

events.emit('model:loaded', model)
```

## 🔌 Electron IPC APIs

### Main Process APIs

```typescript
// In main process (electron/main.ts)
ipcMain.handle('system:getInfo', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    // ... more system info
  }
})

ipcMain.handle('file:read', async (event, path: string) => {
  return fs.readFileSync(path, 'utf8')
})

ipcMain.handle('shimmy:start', async () => {
  // Start Shimmy server process
})
```

### Renderer Process APIs

```typescript
// In renderer process (src/lib/electron.ts)
export const electronAPI = {
  // System operations
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
  
  // File operations
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),
  writeFile: (path: string, content: string) => 
    ipcRenderer.invoke('file:write', path, content),
  
  // Shimmy server operations
  startShimmy: () => ipcRenderer.invoke('shimmy:start'),
  stopShimmy: () => ipcRenderer.invoke('shimmy:stop'),
  
  // Window operations
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
}
```

## 📡 WebSocket APIs

### Real-time Updates

```typescript
class WebSocketClient {
  constructor(url: string)
  
  connect(): Promise<void>
  disconnect(): void
  
  subscribe(channel: string, callback: (data: any) => void): void
  unsubscribe(channel: string): void
  
  send(message: any): void
}

// Usage
import { wsClient } from '@/lib/websocket'

// Subscribe to log updates
wsClient.subscribe('logs', (logEntry) => {
  console.log('New log:', logEntry)
})

// Subscribe to system metrics
wsClient.subscribe('metrics', (metrics) => {
  updateMetricsDisplay(metrics)
})
```

## 🔒 Security APIs

### Authentication

```typescript
interface AuthService {
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, hash: string): Promise<boolean>
  generateToken(user: User): string
  verifyToken(token: string): User | null
  generateApiKey(): string
  validateApiKey(key: string): boolean
}
```

### Encryption

```typescript
interface CryptoService {
  encrypt(data: string, key: string): string
  decrypt(encryptedData: string, key: string): string
  generateKey(): string
  hash(data: string): string
}
```

## 📊 Analytics APIs

### Usage Tracking

```typescript
interface Analytics {
  track(event: string, properties?: Record<string, any>): void
  identify(userId: string, traits?: Record<string, any>): void
  page(name: string, properties?: Record<string, any>): void
  
  setEnabled(enabled: boolean): void
  flush(): Promise<void>
}

// Usage
import { analytics } from '@/lib/analytics'

analytics.track('chat:message_sent', {
  sessionId: session.id,
  messageLength: message.length,
  model: session.settings.model
})
```

## 🧪 Testing APIs

### Test Utilities

```typescript
// Test helpers
export const testUtils = {
  createMockStore: <T>(initialState: T) => MockStore<T>
  mockApiResponse: <T>(data: T, delay?: number) => Promise<T>
  mockApiError: (message: string, status?: number) => Promise<never>
  
  // Mock data generators
  mockUser: (overrides?: Partial<User>) => User
  mockChatSession: (overrides?: Partial<ChatSession>) => ChatSession
  mockDocument: (overrides?: Partial<Document>) => Document
}

// Component testing
export const renderWithProviders = (
  component: ReactElement,
  options?: RenderOptions
) => RenderResult
```

## 📝 Type Definitions

### Core Types

```typescript
// User types
interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  isActive: boolean
  lastLogin: Date
  preferences: UserPreferences
}

// Chat types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type: 'text' | 'code' | 'image' | 'file' | 'error'
  timestamp: Date
  metadata?: MessageMetadata
}

// System types
interface SystemInfo {
  platform: string
  arch: string
  version: string
  totalMemory: number
  freeMemory: number
  cpuCount: number
  uptime: number
}

// Model types
interface Model {
  id: string
  name: string
  size: string
  status: 'available' | 'loading' | 'loaded' | 'error'
  memoryUsage: number
  path?: string
  config?: ModelConfig
}
```

## 🔄 Error Handling

### Error Types

```typescript
class ShimmyServeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  )
}

class APIError extends ShimmyServeError {
  constructor(message: string, statusCode: number, details?: any)
}

class ValidationError extends ShimmyServeError {
  constructor(message: string, field: string, value: any)
}
```

### Error Handling Patterns

```typescript
// In stores
try {
  const result = await apiCall()
  set({ data: result, error: null })
} catch (error) {
  set({ error: error.message, data: null })
  logger.error('API call failed', { error, context })
}

// In components
const { data, error, isLoading } = useQuery('key', fetchData)

if (error) {
  return <ErrorBoundary error={error} />
}
```

---

This API documentation provides a comprehensive overview of ShimmyServe's internal architecture and interfaces. For more specific implementation details, refer to the source code and inline documentation.

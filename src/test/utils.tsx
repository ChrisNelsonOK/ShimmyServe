import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
    textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>,
    select: ({ children, ...props }: any) => <select {...props}>{children}</select>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn()
  })
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="test-wrapper">{children}</div>
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options })

// Mock store creators for Zustand
export const createMockStore = <T extends object>(initialState: T) => {
  let state = { ...initialState }
  
  const getState = () => state
  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    } else {
      state = { ...state, ...partial }
    }
  }
  
  return {
    getState,
    setState,
    subscribe: vi.fn(),
    destroy: vi.fn()
  }
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, status = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message)
      ;(error as any).status = status
      reject(error)
    }, delay)
  })
}

// Mock system info
export const mockSystemInfo = {
  platform: 'darwin',
  arch: 'x64',
  version: '10.15.7',
  totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
  freeMemory: 8 * 1024 * 1024 * 1024,   // 8GB
  cpuCount: 8,
  uptime: 86400, // 1 day
  loadAverage: [1.2, 1.5, 1.8],
  networkInterfaces: {
    en0: [
      {
        address: '192.168.1.100',
        netmask: '255.255.255.0',
        family: 'IPv4',
        mac: '00:00:00:00:00:00',
        internal: false,
        cidr: '192.168.1.100/24'
      }
    ]
  }
}

// Mock Shimmy server status
export const mockShimmyStatus = {
  status: 'running',
  version: '1.0.0',
  uptime: 3600,
  models: [
    {
      id: 'llama-2-7b-chat',
      name: 'Llama 2 7B Chat',
      size: '7B',
      status: 'loaded',
      memoryUsage: 14 * 1024 * 1024 * 1024 // 14GB
    },
    {
      id: 'mistral-7b-instruct',
      name: 'Mistral 7B Instruct',
      size: '7B',
      status: 'available',
      memoryUsage: 0
    }
  ],
  stats: {
    totalRequests: 1250,
    successfulRequests: 1200,
    failedRequests: 50,
    averageResponseTime: 850,
    tokensGenerated: 125000,
    modelsLoaded: 1
  }
}

// Mock log entries
export const mockLogEntries = [
  {
    id: '1',
    timestamp: new Date('2023-12-01T10:00:00Z'),
    level: 'info',
    source: 'shimmy',
    message: 'Server started successfully',
    details: { port: 8080, version: '1.0.0' }
  },
  {
    id: '2',
    timestamp: new Date('2023-12-01T10:01:00Z'),
    level: 'info',
    source: 'shimmy',
    message: 'Model loaded: llama-2-7b-chat',
    details: { modelId: 'llama-2-7b-chat', loadTime: 15000 }
  },
  {
    id: '3',
    timestamp: new Date('2023-12-01T10:02:00Z'),
    level: 'warn',
    source: 'app',
    message: 'High memory usage detected',
    details: { usage: 0.85, threshold: 0.8 }
  },
  {
    id: '4',
    timestamp: new Date('2023-12-01T10:03:00Z'),
    level: 'error',
    source: 'api',
    message: 'Request timeout',
    details: { endpoint: '/v1/generate', timeout: 30000 }
  }
]

// Mock documents for knowledge base
export const mockDocuments = [
  {
    id: '1',
    title: 'Getting Started with Shimmy',
    content: 'Shimmy is a high-performance LLM inference server...',
    type: 'markdown',
    size: 2048,
    uploadedAt: new Date('2023-12-01T09:00:00Z'),
    tags: ['documentation', 'getting-started'],
    embeddings: new Array(384).fill(0).map(() => Math.random()),
    summary: 'Introduction to Shimmy server setup and basic usage'
  },
  {
    id: '2',
    title: 'API Reference',
    content: 'The Shimmy API provides endpoints for model management...',
    type: 'markdown',
    size: 4096,
    uploadedAt: new Date('2023-12-01T09:30:00Z'),
    tags: ['documentation', 'api'],
    embeddings: new Array(384).fill(0).map(() => Math.random()),
    summary: 'Complete API reference for Shimmy server endpoints'
  }
]

// Mock chat messages
export const mockChatMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Hello, how are you?',
    type: 'text' as const,
    timestamp: new Date('2023-12-01T11:00:00Z')
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'Hello! I\'m doing well, thank you for asking. How can I help you today?',
    type: 'text' as const,
    timestamp: new Date('2023-12-01T11:00:05Z'),
    metadata: {
      model: 'shimmer-assistant',
      tokens: 15,
      duration: 1200,
      temperature: 0.7
    }
  }
]

// Mock terminal commands
export const mockTerminalCommands = [
  {
    id: '1',
    command: 'ls -la',
    output: 'total 24\ndrwxr-xr-x  6 user  staff   192 Dec  1 10:00 .\ndrwxr-xr-x  3 user  staff    96 Dec  1 09:00 ..',
    exitCode: 0,
    timestamp: new Date('2023-12-01T12:00:00Z'),
    duration: 100,
    isRunning: false
  },
  {
    id: '2',
    command: 'shimmy status',
    output: 'Shimmy Server Status:\n- Status: Running\n- Uptime: 2h 30m\n- Models Loaded: 1',
    exitCode: 0,
    timestamp: new Date('2023-12-01T12:01:00Z'),
    duration: 500,
    isRunning: false
  }
]

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Fire event helpers
export const fireEvent = {
  click: (element: Element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  },
  change: (element: Element, value: string) => {
    ;(element as HTMLInputElement).value = value
    element.dispatchEvent(new Event('change', { bubbles: true }))
  },
  keyDown: (element: Element, key: string) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

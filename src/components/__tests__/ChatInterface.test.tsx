import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils'
import ChatInterface from '../ChatInterface'
import { useChatStore } from '../../stores/chatStore'
import { useAuthStore } from '../../stores/authStore'

// Mock the stores
vi.mock('../../stores/chatStore')
vi.mock('../../stores/authStore')
vi.mock('../../stores/knowledgeStore')

const mockChatStore = {
  sessions: [],
  activeSessionId: null,
  currentMessage: '',
  isGenerating: false,
  ragEnabled: true,
  ragResults: [],
  showRAGPanel: false,
  autoScroll: true,
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  switchSession: vi.fn(),
  updateSessionSettings: vi.fn(),
  sendMessage: vi.fn(),
  editMessage: vi.fn(),
  deleteMessage: vi.fn(),
  regenerateMessage: vi.fn(),
  toggleRAG: vi.fn(),
  setCurrentMessage: vi.fn(),
  getActiveSession: vi.fn(),
  exportSession: vi.fn(),
  clearSession: vi.fn(),
  toggleSettings: vi.fn(),
  toggleRAGPanel: vi.fn(),
  setAutoScroll: vi.fn()
}

const mockAuthStore = {
  canAccessFeature: vi.fn()
}

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    ;(useChatStore as any).mockReturnValue(mockChatStore)
    ;(useAuthStore as any).mockReturnValue(mockAuthStore)
    
    mockAuthStore.canAccessFeature.mockReturnValue(true)
    mockChatStore.getActiveSession.mockReturnValue(null)
  })

  describe('Access Control', () => {
    it('should show access denied when user lacks permission', () => {
      mockAuthStore.canAccessFeature.mockReturnValue(false)
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access the chat interface")).toBeInTheDocument()
    })

    it('should render chat interface when user has permission', () => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Chat with Shimmer')).toBeInTheDocument()
      expect(screen.getByText('AI-powered assistant with knowledge base integration')).toBeInTheDocument()
    })
  })

  describe('Session Management', () => {
    beforeEach(() => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
    })

    it('should create new session when button is clicked', () => {
      render(<ChatInterface />)
      
      const newChatButton = screen.getByText('New Chat')
      fireEvent.click(newChatButton)
      
      expect(mockChatStore.createSession).toHaveBeenCalled()
    })

    it('should display session tabs when sessions exist', () => {
      const mockSessions = [
        {
          id: '1',
          title: 'Chat 1',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            model: 'shimmer-assistant',
            temperature: 0.7,
            maxTokens: 2048,
            systemPrompt: 'Test prompt',
            useRAG: true,
            ragSources: []
          },
          isActive: true
        },
        {
          id: '2',
          title: 'Chat 2',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            model: 'shimmer-assistant',
            temperature: 0.7,
            maxTokens: 2048,
            systemPrompt: 'Test prompt',
            useRAG: true,
            ragSources: []
          },
          isActive: false
        }
      ]

      mockChatStore.sessions = mockSessions
      mockChatStore.activeSessionId = '1'
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Chat 1')).toBeInTheDocument()
      expect(screen.getByText('Chat 2')).toBeInTheDocument()
    })

    it('should switch session when tab is clicked', () => {
      const mockSessions = [
        {
          id: '1',
          title: 'Chat 1',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            model: 'shimmer-assistant',
            temperature: 0.7,
            maxTokens: 2048,
            systemPrompt: 'Test prompt',
            useRAG: true,
            ragSources: []
          },
          isActive: true
        },
        {
          id: '2',
          title: 'Chat 2',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            model: 'shimmer-assistant',
            temperature: 0.7,
            maxTokens: 2048,
            systemPrompt: 'Test prompt',
            useRAG: true,
            ragSources: []
          },
          isActive: false
        }
      ]

      mockChatStore.sessions = mockSessions
      mockChatStore.activeSessionId = '1'
      
      render(<ChatInterface />)
      
      const chat2Tab = screen.getByText('Chat 2')
      fireEvent.click(chat2Tab)
      
      expect(mockChatStore.switchSession).toHaveBeenCalledWith('2')
    })
  })

  describe('Message Input', () => {
    beforeEach(() => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
      mockChatStore.getActiveSession.mockReturnValue({
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          model: 'shimmer-assistant',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'Test prompt',
          useRAG: true,
          ragSources: []
        },
        isActive: true
      })
    })

    it('should update current message when typing', () => {
      render(<ChatInterface />)
      
      const messageInput = screen.getByPlaceholderText('Type your message... (Shift+Enter for new line)')
      fireEvent.change(messageInput, { target: { value: 'Hello world' } })
      
      expect(mockChatStore.setCurrentMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should send message when send button is clicked', () => {
      mockChatStore.currentMessage = 'Hello world'
      
      render(<ChatInterface />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)
      
      expect(mockChatStore.sendMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should send message when Enter key is pressed', () => {
      mockChatStore.currentMessage = 'Hello world'
      
      render(<ChatInterface />)
      
      const messageInput = screen.getByPlaceholderText('Type your message... (Shift+Enter for new line)')
      fireEvent.keyDown(messageInput, { key: 'Enter', shiftKey: false })
      
      expect(mockChatStore.sendMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should not send message when Shift+Enter is pressed', () => {
      mockChatStore.currentMessage = 'Hello world'
      
      render(<ChatInterface />)
      
      const messageInput = screen.getByPlaceholderText('Type your message... (Shift+Enter for new line)')
      fireEvent.keyDown(messageInput, { key: 'Enter', shiftKey: true })
      
      expect(mockChatStore.sendMessage).not.toHaveBeenCalled()
    })

    it('should disable send button when generating', () => {
      mockChatStore.isGenerating = true
      mockChatStore.currentMessage = 'Hello world'
      
      render(<ChatInterface />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })

    it('should disable send button when message is empty', () => {
      mockChatStore.currentMessage = ''
      
      render(<ChatInterface />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })
  })

  describe('RAG Integration', () => {
    beforeEach(() => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
    })

    it('should toggle RAG when button is clicked', () => {
      render(<ChatInterface />)
      
      const ragButton = screen.getByText(/RAG/i)
      fireEvent.click(ragButton)
      
      expect(mockChatStore.toggleRAGPanel).toHaveBeenCalled()
    })

    it('should show RAG results when available', () => {
      mockChatStore.showRAGPanel = true
      mockChatStore.ragResults = [
        {
          documentId: '1',
          title: 'Test Document',
          content: 'This is test content from the knowledge base',
          score: 0.9
        }
      ]
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Knowledge Base Results')).toBeInTheDocument()
      expect(screen.getByText('Test Document')).toBeInTheDocument()
      expect(screen.getByText('This is test content from the knowledge base')).toBeInTheDocument()
      expect(screen.getByText('(90%)')).toBeInTheDocument()
    })
  })

  describe('Settings Panel', () => {
    beforeEach(() => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
      mockChatStore.getActiveSession.mockReturnValue({
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          model: 'shimmer-assistant',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'Test system prompt',
          useRAG: true,
          ragSources: []
        },
        isActive: true
      })
    })

    it('should show settings panel when settings button is clicked', () => {
      mockChatStore.showSettings = true
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Model')).toBeInTheDocument()
      expect(screen.getByText('Temperature: 0.7')).toBeInTheDocument()
      expect(screen.getByText('Max Tokens')).toBeInTheDocument()
      expect(screen.getByText('System Prompt')).toBeInTheDocument()
    })

    it('should update session settings when model is changed', () => {
      mockChatStore.showSettings = true
      
      render(<ChatInterface />)
      
      const modelSelect = screen.getByDisplayValue('Shimmer Assistant')
      fireEvent.change(modelSelect, { target: { value: 'llama-2-7b-chat' } })
      
      expect(mockChatStore.updateSessionSettings).toHaveBeenCalledWith('1', { model: 'llama-2-7b-chat' })
    })

    it('should clear chat when clear button is clicked', () => {
      mockChatStore.showSettings = true
      
      render(<ChatInterface />)
      
      const clearButton = screen.getByText('Clear Chat')
      fireEvent.click(clearButton)
      
      expect(mockChatStore.clearSession).toHaveBeenCalledWith('1')
    })
  })

  describe('Message Display', () => {
    beforeEach(() => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
    })

    it('should show welcome message when no messages exist', () => {
      mockChatStore.getActiveSession.mockReturnValue({
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          model: 'shimmer-assistant',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'Test prompt',
          useRAG: true,
          ragSources: []
        },
        isActive: true
      })
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Welcome to Shimmer AI')).toBeInTheDocument()
      expect(screen.getByText("I'm your AI assistant. How can I help you today?")).toBeInTheDocument()
    })

    it('should show suggestion buttons in welcome screen', () => {
      mockChatStore.getActiveSession.mockReturnValue({
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          model: 'shimmer-assistant',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'Test prompt',
          useRAG: true,
          ragSources: []
        },
        isActive: true
      })
      
      render(<ChatInterface />)
      
      expect(screen.getByText('What can you help me with?')).toBeInTheDocument()
      expect(screen.getByText('Show me Shimmy server status')).toBeInTheDocument()
      expect(screen.getByText('Help me with code examples')).toBeInTheDocument()
      expect(screen.getByText('Search my documents')).toBeInTheDocument()
    })

    it('should set current message when suggestion is clicked', () => {
      mockChatStore.getActiveSession.mockReturnValue({
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          model: 'shimmer-assistant',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'Test prompt',
          useRAG: true,
          ragSources: []
        },
        isActive: true
      })
      
      render(<ChatInterface />)
      
      const suggestion = screen.getByText('What can you help me with?')
      fireEvent.click(suggestion)
      
      expect(mockChatStore.setCurrentMessage).toHaveBeenCalledWith('What can you help me with?')
    })

    it('should show typing indicator when generating', () => {
      mockChatStore.isGenerating = true
      mockChatStore.getActiveSession.mockReturnValue({
        id: '1',
        title: 'Test Chat',
        messages: [
          {
            id: '1',
            role: 'user' as const,
            content: 'Hello',
            type: 'text' as const,
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          model: 'shimmer-assistant',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'Test prompt',
          useRAG: true,
          ragSources: []
        },
        isActive: true
      })
      
      render(<ChatInterface />)
      
      expect(screen.getByText('Thinking...')).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    beforeEach(() => {
      mockAuthStore.canAccessFeature.mockReturnValue(true)
      mockChatStore.activeSessionId = '1'
      mockChatStore.exportSession.mockReturnValue('{"test": "data"}')
    })

    it('should export session when export button is clicked', () => {
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
      
      render(<ChatInterface />)
      
      const exportButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(exportButton)
      
      expect(mockChatStore.exportSession).toHaveBeenCalledWith('1')
      expect(mockLink.click).toHaveBeenCalled()
    })
  })
})

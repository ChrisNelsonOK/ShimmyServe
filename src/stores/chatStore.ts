import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useKnowledgeStore } from './knowledgeStore'

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'text' | 'code' | 'image' | 'file' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  type: MessageType
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    duration?: number
    temperature?: number
    context?: string[]
    attachments?: string[]
    codeLanguage?: string
    error?: string
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  settings: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
    useRAG: boolean
    ragSources: string[]
  }
  isActive: boolean
}

export interface ChatState {
  // Sessions
  sessions: ChatSession[]
  activeSessionId: string | null
  
  // Current conversation state
  currentMessage: string
  isTyping: boolean
  isGenerating: boolean
  
  // AI settings
  availableModels: string[]
  defaultSettings: ChatSession['settings']
  
  // RAG integration
  ragEnabled: boolean
  ragResults: Array<{
    documentId: string
    title: string
    content: string
    score: number
  }>
  
  // UI state
  showSettings: boolean
  showRAGPanel: boolean
  autoScroll: boolean
  
  // Actions
  createSession: (title?: string) => string
  deleteSession: (sessionId: string) => void
  switchSession: (sessionId: string) => void
  updateSessionSettings: (sessionId: string, settings: Partial<ChatSession['settings']>) => void
  
  // Message management
  sendMessage: (content: string, sessionId?: string) => Promise<void>
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>, sessionId?: string) => void
  editMessage: (messageId: string, content: string, sessionId?: string) => void
  deleteMessage: (messageId: string, sessionId?: string) => void
  regenerateMessage: (messageId: string, sessionId?: string) => Promise<void>
  
  // RAG functionality
  searchKnowledgeBase: (query: string) => Promise<void>
  toggleRAG: () => void
  
  // Utilities
  setCurrentMessage: (message: string) => void
  getActiveSession: () => ChatSession | null
  exportSession: (sessionId: string) => string
  importSession: (data: string) => Promise<{ success: boolean; error?: string }>
  clearSession: (sessionId: string) => void
  
  // Settings
  toggleSettings: () => void
  toggleRAGPanel: () => void
  setAutoScroll: (enabled: boolean) => void
}

// Real AI response generation using Shimmy server
const generateAIResponse = async (
  messages: ChatMessage[],
  settings: ChatSession['settings'],
  ragContext?: string[]
): Promise<{ content: string; metadata: ChatMessage['metadata'] }> => {
  try {
    if (window.electronAPI) {
      const lastMessage = messages[messages.length - 1]
      const userMessage = lastMessage?.content || ''

      // Prepare the chat request
      const chatRequest = {
        model: settings.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: false
      }

      const startTime = Date.now()
      const response = await window.electronAPI.shimmy.chat(chatRequest)
      const duration = Date.now() - startTime

      return {
        content: response.message?.content || 'No response received from AI model.',
        metadata: {
          model: settings.model,
          tokens: response.usage?.total_tokens || 0,
          duration,
          temperature: settings.temperature,
          context: ragContext
        }
      }
    } else {
      throw new Error('Electron API not available')
    }
  } catch (error) {
    console.error('Failed to generate AI response:', error)
    return {
      content: `I apologize, but I'm unable to generate a response at the moment. Please ensure the Shimmy server is running and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        model: settings.model,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: ragContext
      }
    }
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      activeSessionId: null,
      currentMessage: '',
      isTyping: false,
      isGenerating: false,
      availableModels: ['llama-2-7b-chat', 'mistral-7b-instruct', 'codellama-7b', 'shimmer-assistant'],
      defaultSettings: {
        model: 'shimmer-assistant',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: 'You are Shimmer, a helpful AI assistant integrated with ShimmyServe. You help users manage their Shimmy server, analyze documents, and provide technical assistance.',
        useRAG: true,
        ragSources: []
      },
      ragEnabled: true,
      ragResults: [],
      showSettings: false,
      showRAGPanel: false,
      autoScroll: true,

      // Create new session
      createSession: (title) => {
        const sessionId = crypto.randomUUID()
        const now = new Date()
        
        const newSession: ChatSession = {
          id: sessionId,
          title: title || `Chat ${get().sessions.length + 1}`,
          messages: [],
          createdAt: now,
          updatedAt: now,
          settings: { ...get().defaultSettings },
          isActive: true
        }

        set(state => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: sessionId
        }))

        return sessionId
      },

      // Delete session
      deleteSession: (sessionId) => {
        set(state => {
          const updatedSessions = state.sessions.filter(s => s.id !== sessionId)
          const newActiveId = state.activeSessionId === sessionId 
            ? (updatedSessions.length > 0 ? updatedSessions[0].id : null)
            : state.activeSessionId

          return {
            sessions: updatedSessions,
            activeSessionId: newActiveId
          }
        })
      },

      // Switch active session
      switchSession: (sessionId) => {
        set({ activeSessionId: sessionId })
      },

      // Update session settings
      updateSessionSettings: (sessionId, settings) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, settings: { ...session.settings, ...settings }, updatedAt: new Date() }
              : session
          )
        }))
      },

      // Send message
      sendMessage: async (content, sessionId) => {
        const targetSessionId = sessionId || get().activeSessionId
        if (!targetSessionId || !content.trim()) return

        set({ isGenerating: true })

        // Add user message
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: content.trim(),
          type: 'text',
          timestamp: new Date()
        }

        get().addMessage(userMessage, targetSessionId)

        try {
          const session = get().sessions.find(s => s.id === targetSessionId)
          if (!session) return

          // Search knowledge base if RAG is enabled
          let ragContext: string[] = []
          if (session.settings.useRAG && get().ragEnabled) {
            await get().searchKnowledgeBase(content)
            ragContext = get().ragResults.map(result => result.content)
          }

          // Generate AI response
          const { content: aiContent, metadata } = await generateAIResponse(
            session.messages,
            session.settings,
            ragContext
          )

          // Add AI response
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: aiContent,
            type: aiContent.includes('```') ? 'code' : 'text',
            timestamp: new Date(),
            metadata
          }

          get().addMessage(aiMessage, targetSessionId)

        } catch (error) {
          // Add error message
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'I apologize, but I encountered an error while processing your request. Please try again.',
            type: 'error',
            timestamp: new Date(),
            metadata: { error: String(error) }
          }

          get().addMessage(errorMessage, targetSessionId)
        } finally {
          set({ isGenerating: false })
        }
      },

      // Add message to session
      addMessage: (message, sessionId) => {
        const targetSessionId = sessionId || get().activeSessionId
        if (!targetSessionId) return

        const fullMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date()
        }

        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: [...session.messages, fullMessage],
                  updatedAt: new Date()
                }
              : session
          )
        }))
      },

      // Edit message
      editMessage: (messageId, content, sessionId) => {
        const targetSessionId = sessionId || get().activeSessionId
        if (!targetSessionId) return

        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === messageId ? { ...msg, content } : msg
                  ),
                  updatedAt: new Date()
                }
              : session
          )
        }))
      },

      // Delete message
      deleteMessage: (messageId, sessionId) => {
        const targetSessionId = sessionId || get().activeSessionId
        if (!targetSessionId) return

        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: session.messages.filter(msg => msg.id !== messageId),
                  updatedAt: new Date()
                }
              : session
          )
        }))
      },

      // Regenerate message
      regenerateMessage: async (messageId, sessionId) => {
        const targetSessionId = sessionId || get().activeSessionId
        if (!targetSessionId) return

        const session = get().sessions.find(s => s.id === targetSessionId)
        if (!session) return

        const messageIndex = session.messages.findIndex(msg => msg.id === messageId)
        if (messageIndex === -1) return

        // Remove the message and all messages after it
        const messagesToKeep = session.messages.slice(0, messageIndex)
        
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === targetSessionId
              ? { ...s, messages: messagesToKeep }
              : s
          )
        }))

        // Get the last user message to regenerate from
        const lastUserMessage = messagesToKeep.reverse().find(msg => msg.role === 'user')
        if (lastUserMessage) {
          await get().sendMessage(lastUserMessage.content, targetSessionId)
        }
      },

      // Search knowledge base
      searchKnowledgeBase: async (query) => {
        try {
          // Get knowledge store instance
          const knowledgeStore = useKnowledgeStore.getState()
          
          // Perform search
          await knowledgeStore.searchDocuments(query, true) // Use semantic search
          
          // Convert search results to RAG format
          const ragResults = knowledgeStore.searchResults.slice(0, 5).map(result => ({
            documentId: result.document.id,
            title: result.document.title,
            content: result.relevantChunks[0]?.content || result.document.content.substring(0, 500),
            score: result.score
          }))

          set({ ragResults })
        } catch (error) {
          console.error('Knowledge base search failed:', error)
          set({ ragResults: [] })
        }
      },

      // Toggle RAG
      toggleRAG: () => {
        set(state => ({ ragEnabled: !state.ragEnabled }))
      },

      // Set current message
      setCurrentMessage: (message) => {
        set({ currentMessage: message })
      },

      // Get active session
      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find(s => s.id === activeSessionId) || null
      },

      // Export session
      exportSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (!session) return ''

        const exportData = {
          title: session.title,
          createdAt: session.createdAt,
          settings: session.settings,
          messages: session.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            type: msg.type,
            timestamp: msg.timestamp,
            metadata: msg.metadata
          }))
        }

        return JSON.stringify(exportData, null, 2)
      },

      // Import session
      importSession: async (data) => {
        try {
          const sessionData = JSON.parse(data)
          const sessionId = get().createSession(sessionData.title)
          
          // Update session with imported data
          set(state => ({
            sessions: state.sessions.map(session =>
              session.id === sessionId
                ? {
                    ...session,
                    messages: sessionData.messages.map((msg: any) => ({
                      ...msg,
                      id: crypto.randomUUID(),
                      timestamp: new Date(msg.timestamp)
                    })),
                    settings: sessionData.settings,
                    createdAt: new Date(sessionData.createdAt)
                  }
                : session
            )
          }))

          return { success: true }
        } catch (error) {
          return { success: false, error: 'Invalid session data format' }
        }
      },

      // Clear session
      clearSession: (sessionId) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, messages: [], updatedAt: new Date() }
              : session
          )
        }))
      },

      // Toggle settings
      toggleSettings: () => {
        set(state => ({ showSettings: !state.showSettings }))
      },

      // Toggle RAG panel
      toggleRAGPanel: () => {
        set(state => ({ showRAGPanel: !state.showRAGPanel }))
      },

      // Set auto scroll
      setAutoScroll: (enabled) => {
        set({ autoScroll: enabled })
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        defaultSettings: state.defaultSettings,
        ragEnabled: state.ragEnabled,
        autoScroll: state.autoScroll
      })
    }
  )
)

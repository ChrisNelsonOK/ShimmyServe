import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChatStore } from '../chatStore'

// Mock the knowledge store
vi.mock('../knowledgeStore', () => ({
  useKnowledgeStore: {
    getState: () => ({
      searchDocuments: vi.fn(),
      searchResults: [
        {
          document: { id: '1', title: 'Test Doc', content: 'Test content' },
          score: 0.9,
          relevantChunks: [{ content: 'Relevant content' }]
        }
      ]
    })
  }
}))

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useChatStore.setState({
      sessions: [],
      activeSessionId: null,
      currentMessage: '',
      isTyping: false,
      isGenerating: false,
      ragEnabled: true,
      ragResults: [],
      showSettings: false,
      showRAGPanel: false,
      autoScroll: true
    })
    vi.clearAllMocks()
  })

  describe('Session Management', () => {
    it('should create a new session', () => {
      const store = useChatStore.getState()
      
      const sessionId = store.createSession('Test Chat')
      
      expect(sessionId).toBeDefined()
      expect(useChatStore.getState().sessions).toHaveLength(1)
      expect(useChatStore.getState().sessions[0].title).toBe('Test Chat')
      expect(useChatStore.getState().activeSessionId).toBe(sessionId)
    })

    it('should create session with default title', () => {
      const store = useChatStore.getState()
      
      const sessionId = store.createSession()
      
      expect(useChatStore.getState().sessions[0].title).toBe('Chat 1')
    })

    it('should switch between sessions', () => {
      const store = useChatStore.getState()
      
      const session1Id = store.createSession('Chat 1')
      const session2Id = store.createSession('Chat 2')
      
      expect(useChatStore.getState().activeSessionId).toBe(session2Id)
      
      store.switchSession(session1Id)
      expect(useChatStore.getState().activeSessionId).toBe(session1Id)
    })

    it('should delete a session', () => {
      const store = useChatStore.getState()
      
      const session1Id = store.createSession('Chat 1')
      const session2Id = store.createSession('Chat 2')
      
      store.deleteSession(session1Id)
      
      expect(useChatStore.getState().sessions).toHaveLength(1)
      expect(useChatStore.getState().sessions[0].id).toBe(session2Id)
      expect(useChatStore.getState().activeSessionId).toBe(session2Id)
    })

    it('should update active session when deleting current session', () => {
      const store = useChatStore.getState()
      
      const session1Id = store.createSession('Chat 1')
      const session2Id = store.createSession('Chat 2')
      
      // Switch to first session and delete it
      store.switchSession(session1Id)
      store.deleteSession(session1Id)
      
      expect(useChatStore.getState().activeSessionId).toBe(session2Id)
    })

    it('should set activeSessionId to null when deleting last session', () => {
      const store = useChatStore.getState()
      
      const sessionId = store.createSession('Only Chat')
      store.deleteSession(sessionId)
      
      expect(useChatStore.getState().sessions).toHaveLength(0)
      expect(useChatStore.getState().activeSessionId).toBeNull()
    })

    it('should update session settings', () => {
      const store = useChatStore.getState()
      
      const sessionId = store.createSession('Test Chat')
      
      store.updateSessionSettings(sessionId, {
        temperature: 0.9,
        maxTokens: 1024,
        model: 'test-model'
      })
      
      const session = useChatStore.getState().sessions[0]
      expect(session.settings.temperature).toBe(0.9)
      expect(session.settings.maxTokens).toBe(1024)
      expect(session.settings.model).toBe('test-model')
    })

    it('should get active session', () => {
      const store = useChatStore.getState()
      
      expect(store.getActiveSession()).toBeNull()
      
      const sessionId = store.createSession('Test Chat')
      const activeSession = store.getActiveSession()
      
      expect(activeSession).toBeDefined()
      expect(activeSession?.id).toBe(sessionId)
      expect(activeSession?.title).toBe('Test Chat')
    })

    it('should clear session messages', () => {
      const store = useChatStore.getState()
      
      const sessionId = store.createSession('Test Chat')
      
      // Add some messages
      store.addMessage({
        role: 'user',
        content: 'Hello',
        type: 'text'
      }, sessionId)
      
      store.addMessage({
        role: 'assistant',
        content: 'Hi there!',
        type: 'text'
      }, sessionId)
      
      expect(useChatStore.getState().sessions[0].messages).toHaveLength(2)
      
      store.clearSession(sessionId)
      
      expect(useChatStore.getState().sessions[0].messages).toHaveLength(0)
    })
  })

  describe('Message Management', () => {
    let sessionId: string

    beforeEach(() => {
      const store = useChatStore.getState()
      sessionId = store.createSession('Test Chat')
    })

    it('should add message to session', () => {
      const store = useChatStore.getState()
      
      store.addMessage({
        role: 'user',
        content: 'Hello world',
        type: 'text'
      }, sessionId)
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages).toHaveLength(1)
      expect(session.messages[0].content).toBe('Hello world')
      expect(session.messages[0].role).toBe('user')
      expect(session.messages[0].id).toBeDefined()
      expect(session.messages[0].timestamp).toBeInstanceOf(Date)
    })

    it('should add message to active session when no sessionId provided', () => {
      const store = useChatStore.getState()
      
      store.addMessage({
        role: 'user',
        content: 'Hello world',
        type: 'text'
      })
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages).toHaveLength(1)
      expect(session.messages[0].content).toBe('Hello world')
    })

    it('should edit message', () => {
      const store = useChatStore.getState()
      
      store.addMessage({
        role: 'user',
        content: 'Original message',
        type: 'text'
      }, sessionId)
      
      const messageId = useChatStore.getState().sessions[0].messages[0].id
      
      store.editMessage(messageId, 'Edited message', sessionId)
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages[0].content).toBe('Edited message')
    })

    it('should delete message', () => {
      const store = useChatStore.getState()
      
      store.addMessage({
        role: 'user',
        content: 'Message 1',
        type: 'text'
      }, sessionId)
      
      store.addMessage({
        role: 'user',
        content: 'Message 2',
        type: 'text'
      }, sessionId)
      
      const messageId = useChatStore.getState().sessions[0].messages[0].id
      
      store.deleteMessage(messageId, sessionId)
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages).toHaveLength(1)
      expect(session.messages[0].content).toBe('Message 2')
    })

    it('should send message and generate AI response', async () => {
      const store = useChatStore.getState()
      
      await store.sendMessage('Hello AI', sessionId)
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages).toHaveLength(2) // User message + AI response
      expect(session.messages[0].role).toBe('user')
      expect(session.messages[0].content).toBe('Hello AI')
      expect(session.messages[1].role).toBe('assistant')
      expect(session.messages[1].content).toBeDefined()
      expect(session.messages[1].metadata).toBeDefined()
    })

    it('should not send empty message', async () => {
      const store = useChatStore.getState()
      
      await store.sendMessage('   ', sessionId) // Whitespace only
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages).toHaveLength(0)
    })

    it('should regenerate message', async () => {
      const store = useChatStore.getState()
      
      // Add user message and AI response
      store.addMessage({
        role: 'user',
        content: 'Hello',
        type: 'text'
      }, sessionId)
      
      store.addMessage({
        role: 'assistant',
        content: 'Original response',
        type: 'text'
      }, sessionId)
      
      const aiMessageId = useChatStore.getState().sessions[0].messages[1].id
      
      await store.regenerateMessage(aiMessageId, sessionId)
      
      const session = useChatStore.getState().sessions[0]
      expect(session.messages).toHaveLength(2) // Should still have 2 messages
      expect(session.messages[1].content).not.toBe('Original response') // Should be different
    })
  })

  describe('RAG Integration', () => {
    let sessionId: string

    beforeEach(() => {
      const store = useChatStore.getState()
      sessionId = store.createSession('Test Chat')
    })

    it('should toggle RAG', () => {
      const store = useChatStore.getState()
      
      expect(useChatStore.getState().ragEnabled).toBe(true)
      
      store.toggleRAG()
      expect(useChatStore.getState().ragEnabled).toBe(false)
      
      store.toggleRAG()
      expect(useChatStore.getState().ragEnabled).toBe(true)
    })

    it('should search knowledge base', async () => {
      const store = useChatStore.getState()
      
      await store.searchKnowledgeBase('test query')
      
      const ragResults = useChatStore.getState().ragResults
      expect(ragResults).toHaveLength(1)
      expect(ragResults[0].title).toBe('Test Doc')
      expect(ragResults[0].content).toBe('Relevant content')
      expect(ragResults[0].score).toBe(0.9)
    })

    it('should use RAG context in AI responses when enabled', async () => {
      const store = useChatStore.getState()
      
      // Enable RAG for the session
      store.updateSessionSettings(sessionId, { useRAG: true })
      
      await store.sendMessage('Tell me about the documentation', sessionId)
      
      const session = useChatStore.getState().sessions[0]
      const aiResponse = session.messages.find(m => m.role === 'assistant')
      
      expect(aiResponse?.metadata?.context).toBeDefined()
      expect(aiResponse?.metadata?.context?.length).toBeGreaterThan(0)
    })
  })

  describe('Session Import/Export', () => {
    let sessionId: string

    beforeEach(() => {
      const store = useChatStore.getState()
      sessionId = store.createSession('Test Chat')
      
      // Add some messages
      store.addMessage({
        role: 'user',
        content: 'Hello',
        type: 'text'
      }, sessionId)
      
      store.addMessage({
        role: 'assistant',
        content: 'Hi there!',
        type: 'text'
      }, sessionId)
    })

    it('should export session', () => {
      const store = useChatStore.getState()
      
      const exportData = store.exportSession(sessionId)
      
      expect(exportData).toBeDefined()
      
      const parsed = JSON.parse(exportData)
      expect(parsed.title).toBe('Test Chat')
      expect(parsed.messages).toHaveLength(2)
      expect(parsed.settings).toBeDefined()
      expect(parsed.createdAt).toBeDefined()
    })

    it('should import session', async () => {
      const store = useChatStore.getState()
      
      const exportData = store.exportSession(sessionId)
      
      // Clear sessions
      useChatStore.setState({ sessions: [], activeSessionId: null })
      
      const result = await store.importSession(exportData)
      
      expect(result.success).toBe(true)
      expect(useChatStore.getState().sessions).toHaveLength(1)
      expect(useChatStore.getState().sessions[0].title).toBe('Test Chat')
      expect(useChatStore.getState().sessions[0].messages).toHaveLength(2)
    })

    it('should fail to import invalid session data', async () => {
      const store = useChatStore.getState()
      
      const result = await store.importSession('invalid json')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid session data format')
    })
  })

  describe('UI State Management', () => {
    it('should toggle settings panel', () => {
      const store = useChatStore.getState()
      
      expect(useChatStore.getState().showSettings).toBe(false)
      
      store.toggleSettings()
      expect(useChatStore.getState().showSettings).toBe(true)
      
      store.toggleSettings()
      expect(useChatStore.getState().showSettings).toBe(false)
    })

    it('should toggle RAG panel', () => {
      const store = useChatStore.getState()
      
      expect(useChatStore.getState().showRAGPanel).toBe(false)
      
      store.toggleRAGPanel()
      expect(useChatStore.getState().showRAGPanel).toBe(true)
      
      store.toggleRAGPanel()
      expect(useChatStore.getState().showRAGPanel).toBe(false)
    })

    it('should set current message', () => {
      const store = useChatStore.getState()
      
      store.setCurrentMessage('Test message')
      expect(useChatStore.getState().currentMessage).toBe('Test message')
    })

    it('should set auto scroll', () => {
      const store = useChatStore.getState()
      
      store.setAutoScroll(false)
      expect(useChatStore.getState().autoScroll).toBe(false)
      
      store.setAutoScroll(true)
      expect(useChatStore.getState().autoScroll).toBe(true)
    })
  })
})

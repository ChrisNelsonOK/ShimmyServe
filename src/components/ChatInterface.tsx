import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Send, Plus, Settings, Download, Trash2, 
  Edit, Copy, RotateCcw, Search, Brain, FileText, 
  User, Bot, Code, AlertCircle, Clock, Zap, X
} from 'lucide-react'
import { useChatStore, ChatMessage, ChatSession } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import { cn, formatDuration } from '../lib/utils'

export default function ChatInterface() {
  const [showSettings, setShowSettings] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    sessions,
    activeSessionId,
    currentMessage,
    isGenerating,
    ragEnabled,
    ragResults,
    showRAGPanel,
    autoScroll,
    createSession,
    deleteSession,
    switchSession,
    updateSessionSettings,
    sendMessage,
    editMessage,
    deleteMessage,
    regenerateMessage,
    toggleRAG,
    setCurrentMessage,
    getActiveSession,
    exportSession,
    clearSession,
    toggleSettings,
    toggleRAGPanel,
    setAutoScroll
  } = useChatStore()

  const { canAccessFeature } = useAuthStore()

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [sessions, activeSessionId, autoScroll])

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Chat with Shimmer')
    }
  }, [sessions.length, createSession])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const activeSession = getActiveSession()

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return
    
    await sendMessage(currentMessage)
    setCurrentMessage('')
    
    // Focus input after sending
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }

  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim()) {
      editMessage(editingMessageId, editContent.trim())
      setEditingMessageId(null)
      setEditContent('')
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleExportSession = () => {
    if (activeSessionId) {
      const content = exportSession(activeSessionId)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-session-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const formatMessageContent = (message: ChatMessage) => {
    if (message.type === 'code' && message.content.includes('```')) {
      // Split content by code blocks
      const parts = message.content.split(/(```[\s\S]*?```)/g)
      
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.split('\n')
          const language = lines[0].replace('```', '').trim()
          const code = lines.slice(1, -1).join('\n')
          
          return (
            <div key={index} className="my-4 bg-gray-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm text-gray-400">{language || 'code'}</span>
                <button
                  onClick={() => handleCopyMessage(code)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          )
        } else {
          return (
            <div key={index} className="whitespace-pre-wrap">
              {part}
            </div>
          )
        }
      })
    }
    
    return <div className="whitespace-pre-wrap">{message.content}</div>
  }

  const getMessageIcon = (message: ChatMessage) => {
    switch (message.role) {
      case 'user':
        return <User className="w-5 h-5" />
      case 'assistant':
        return message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Bot className="w-5 h-5" />
      case 'system':
        return <Settings className="w-5 h-5" />
      default:
        return <MessageSquare className="w-5 h-5" />
    }
  }

  const getMessageColor = (message: ChatMessage) => {
    switch (message.role) {
      case 'user':
        return 'text-blue-400'
      case 'assistant':
        return message.type === 'error' ? 'text-red-400' : 'text-green-400'
      case 'system':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  if (!canAccessFeature('chat-interface')) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the chat interface</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Chat with Shimmer</h1>
            <p className="text-gray-400 mt-1">
              AI-powered assistant with knowledge base integration
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => createSession()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            
            <button
              onClick={toggleRAGPanel}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                ragEnabled ? "bg-blue-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
              )}
            >
              <Brain className="w-4 h-4" />
              RAG {ragEnabled ? 'On' : 'Off'}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleExportSession}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Session Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors min-w-0",
                session.id === activeSessionId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              )}
              onClick={() => switchSession(session.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{session.title}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && activeSession && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                  <select
                    value={activeSession.settings.model}
                    onChange={(e) => updateSessionSettings(activeSession.id, { model: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="shimmer-assistant">Shimmer Assistant</option>
                    <option value="llama-2-7b-chat">Llama 2 7B Chat</option>
                    <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
                    <option value="codellama-7b">CodeLlama 7B</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature: {activeSession.settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={activeSession.settings.temperature}
                    onChange={(e) => updateSessionSettings(activeSession.id, { temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    min="100"
                    max="4096"
                    value={activeSession.settings.maxTokens}
                    onChange={(e) => updateSessionSettings(activeSession.id, { maxTokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
                <textarea
                  value={activeSession.settings.systemPrompt}
                  onChange={(e) => updateSessionSettings(activeSession.id, { systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activeSession.settings.useRAG}
                    onChange={(e) => updateSessionSettings(activeSession.id, { useRAG: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Use Knowledge Base (RAG)</span>
                </label>
                
                <button
                  onClick={() => activeSessionId && clearSession(activeSessionId)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Chat
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RAG Panel */}
        <AnimatePresence>
          {showRAGPanel && ragResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-medium text-blue-300">Knowledge Base Results</h3>
                <span className="text-xs text-blue-400">({ragResults.length} sources)</span>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {ragResults.map((result, index) => (
                  <div key={index} className="p-2 bg-blue-900/30 rounded border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">{result.title}</span>
                      <span className="text-xs text-blue-400">({Math.round(result.score * 100)}%)</span>
                    </div>
                    <p className="text-xs text-blue-200 line-clamp-2">{result.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
          <div className="flex-1 p-4 overflow-auto">
            {activeSession ? (
              <div className="space-y-4">
                {activeSession.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Bot className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Welcome to Shimmer AI</h3>
                      <p className="mb-4">I'm your AI assistant. How can I help you today?</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          "What can you help me with?",
                          "Show me Shimmy server status",
                          "Help me with code examples",
                          "Search my documents"
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentMessage(suggestion)}
                            className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  activeSession.messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", getMessageColor(message))}>
                        {getMessageIcon(message)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-sm font-medium", getMessageColor(message))}>
                            {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Shimmer' : 'System'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.metadata?.duration && (
                            <span className="text-xs text-gray-500">
                              ({formatDuration(message.metadata.duration)})
                            </span>
                          )}
                        </div>
                        
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-300 text-sm">
                            {formatMessageContent(message)}
                          </div>
                        )}
                        
                        {editingMessageId !== message.id && (
                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopyMessage(message.content)}
                              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {message.role === 'user' && (
                              <button
                                onClick={() => handleEditMessage(message.id, message.content)}
                                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                            {message.role === 'assistant' && (
                              <button
                                onClick={() => regenerateMessage(message.id)}
                                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {isGenerating && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-green-400">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-green-400">Shimmer</span>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                  <p>No active chat session</p>
                  <button
                    onClick={() => createSession()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
                rows={1}
                disabled={isGenerating}
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isGenerating}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Model: {activeSession?.settings.model || 'None'}</span>
                <span>RAG: {ragEnabled ? 'Enabled' : 'Disabled'}</span>
                {activeSession && (
                  <span>Messages: {activeSession.messages.length}</span>
                )}
              </div>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span>Auto-scroll</span>
              </label>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

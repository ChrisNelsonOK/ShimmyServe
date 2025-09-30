import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal as TerminalIcon, Plus, X, Settings, Download,
  Maximize2, Minimize2, Copy, Trash2, Play, Square,
  ChevronRight, Clock, User, Folder, Zap
} from 'lucide-react'
import { useTerminalStore, TerminalSession, TerminalCommand, TERMINAL_THEMES } from '../stores/terminalStore'
import { useAuthStore } from '../stores/authStore'
import { cn, formatDuration } from '../lib/utils'

export default function Terminal() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark')
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    sessions,
    activeSessionId,
    currentCommand,
    commandHistory,
    isVisible,
    fontSize,
    theme,
    showTimestamps,
    createSession,
    deleteSession,
    switchSession,
    executeCommand,
    cancelCommand,
    setCurrentCommand,
    navigateHistory,
    clearHistory,
    toggleVisibility,
    setFontSize,
    setTheme,
    getActiveSession,
    clearSession,
    exportSession
  } = useTerminalStore()

  const { canAccessFeature } = useAuthStore()

  // Auto-scroll to bottom when new output appears
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [sessions, activeSessionId])

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Main Terminal')
    }
  }, [sessions.length, createSession])

  // Focus input when terminal becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  const activeSession = getActiveSession()

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        executeCommand(currentCommand.trim())
        setCurrentCommand('')
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const historyCommand = navigateHistory('up')
      setCurrentCommand(historyCommand)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const historyCommand = navigateHistory('down')
      setCurrentCommand(historyCommand)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // TODO: Implement command autocomplete
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      // Cancel running command
      const runningCommand = activeSession?.commands.find(cmd => cmd.isRunning)
      if (runningCommand) {
        cancelCommand(runningCommand.id)
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      if (activeSessionId) {
        clearSession(activeSessionId)
      }
    }
  }, [currentCommand, executeCommand, setCurrentCommand, navigateHistory, cancelCommand, activeSession, activeSessionId, clearSession])

  const handleNewSession = () => {
    const sessionName = `Terminal ${sessions.length + 1}`
    createSession(sessionName)
  }

  const handleExportSession = () => {
    if (activeSessionId) {
      const content = exportSession(activeSessionId)
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `terminal-session-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const formatCommandOutput = (output: string) => {
    // Handle ANSI escape codes for colors (basic implementation)
    return output
      .replace(/\x1b\[2J\x1b\[H/g, '') // Clear screen
      .split('\n')
      .map((line, index) => (
        <div key={index} className="whitespace-pre-wrap font-mono">
          {line}
        </div>
      ))
  }

  const getPrompt = () => {
    const session = activeSession
    if (!session) return '$ '

    const user = 'shimmy'
    const hostname = 'shimmy-server'
    const cwd = session.workingDirectory.split('/').pop() || '~'

    return (
      <span className="text-green-400">
        {user}@{hostname}
      </span>
    ) + ':' + (
      <span className="text-blue-400">
        {cwd}
      </span>
    ) + '$ '
  }

  if (!canAccessFeature('terminal-access')) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <TerminalIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the terminal</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col h-full",
      isMaximized ? "fixed inset-0 z-50 bg-gray-900" : "p-6"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Terminal Console</h1>
            <p className="text-gray-400 mt-1">
              Interactive system terminal with command execution and history
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Session
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

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
              <TerminalIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{session.name}</span>
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
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{fontSize}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => {
                      setSelectedTheme(e.target.value)
                      setTheme(TERMINAL_THEMES[e.target.value])
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    {Object.keys(TERMINAL_THEMES).map(themeName => (
                      <option key={themeName} value={themeName}>
                        {TERMINAL_THEMES[themeName].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={clearHistory}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear History
                  </button>
                  <span className="text-xs text-gray-400">
                    {commandHistory.length} commands
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Window */}
        <div
          className="flex-1 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col"
          style={{
            backgroundColor: theme.background,
            color: theme.foreground,
            fontSize: `${fontSize}px`
          }}
        >
          {/* Terminal Content */}
          <div
            ref={terminalRef}
            className="flex-1 p-4 overflow-auto font-mono"
            style={{ fontSize: `${fontSize}px` }}
          >
            {activeSession ? (
              <div className="space-y-2">
                {/* Session Info */}
                <div className="text-gray-500 text-sm mb-4">
                  Session: {activeSession.name} | Working Directory: {activeSession.workingDirectory}
                </div>

                {/* Command History */}
                {activeSession.commands.map((command) => (
                  <div key={command.id} className="space-y-1">
                    {/* Command Input */}
                    <div className="flex items-center gap-2">
                      {showTimestamps && (
                        <span className="text-gray-500 text-xs">
                          [{command.timestamp.toLocaleTimeString()}]
                        </span>
                      )}
                      <span dangerouslySetInnerHTML={{ __html: getPrompt() }} />
                      <span className="text-white">{command.command}</span>
                      {command.isRunning && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full" />
                          <span className="text-xs">Running...</span>
                        </div>
                      )}
                      {!command.isRunning && command.duration > 0 && (
                        <span className="text-gray-500 text-xs">
                          ({formatDuration(command.duration)})
                        </span>
                      )}
                    </div>

                    {/* Command Output */}
                    {command.output && (
                      <div className={cn(
                        "pl-4 whitespace-pre-wrap",
                        command.exitCode !== 0 && command.exitCode !== null ? "text-red-400" : "text-gray-300"
                      )}>
                        {formatCommandOutput(command.output)}
                      </div>
                    )}
                  </div>
                ))}

                {/* Current Input */}
                <div className="flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: getPrompt() }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none text-white font-mono"
                    style={{
                      fontSize: `${fontSize}px`,
                      caretColor: theme.cursor
                    }}
                    placeholder="Enter command..."
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <TerminalIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>No active terminal session</p>
                  <button
                    onClick={handleNewSession}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>Sessions: {sessions.length}</span>
              <span>History: {commandHistory.length}</span>
              {activeSession && (
                <span>Commands: {activeSession.commands.length}</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span>Theme: {theme.name}</span>
              <span>Font: {fontSize}px</span>
              {activeSession && (
                <span>PWD: {activeSession.workingDirectory}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

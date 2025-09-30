import React, { useState, useRef, useEffect } from 'react'

interface TerminalSession {
  id: string
  name: string
  isActive: boolean
}

export function Terminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', name: 'Terminal 1', isActive: true },
  ])
  const [activeSessionId, setActiveSessionId] = useState('1')
  const [output, setOutput] = useState<string[]>([
    'Welcome to ShimmyServe Terminal',
    'Type "help" for available commands',
    '',
  ])
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus input and scroll to bottom
    if (inputRef.current) {
      inputRef.current.focus()
    }
    scrollToBottom()
  }, [output])

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim()
    if (!trimmedCommand) return

    // Add command to history
    setCommandHistory(prev => [...prev, trimmedCommand])
    setHistoryIndex(-1)

    // Add command to output
    setOutput(prev => [...prev, `$ ${trimmedCommand}`])

    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 100))

    // Process command
    let response: string[] = []
    
    switch (trimmedCommand.toLowerCase()) {
      case 'help':
        response = [
          'Available commands:',
          '  help     - Show this help message',
          '  clear    - Clear the terminal',
          '  ls       - List files and directories',
          '  pwd      - Show current directory',
          '  date     - Show current date and time',
          '  whoami   - Show current user',
          '  echo     - Echo text',
          '  shimmy   - Shimmy server commands',
          '',
        ]
        break
      
      case 'clear':
        setOutput(['Welcome to ShimmyServe Terminal', 'Type "help" for available commands', ''])
        return
      
      case 'ls':
        response = [
          'drwxr-xr-x  2 user user 4096 Jan 15 10:30 documents',
          'drwxr-xr-x  2 user user 4096 Jan 15 10:30 models',
          '-rw-r--r--  1 user user 1024 Jan 15 10:30 config.json',
          '-rw-r--r--  1 user user 2048 Jan 15 10:30 shimmy.log',
          '',
        ]
        break
      
      case 'pwd':
        response = ['/home/user/shimmy-serve', '']
        break
      
      case 'date':
        response = [new Date().toString(), '']
        break
      
      case 'whoami':
        response = ['user', '']
        break
      
      case 'shimmy':
        response = [
          'Shimmy server commands:',
          '  shimmy status   - Show server status',
          '  shimmy start    - Start the server',
          '  shimmy stop     - Stop the server',
          '  shimmy restart  - Restart the server',
          '',
        ]
        break
      
      case 'shimmy status':
        response = [
          'Shimmy Server Status:',
          '  Status: Running',
          '  PID: 12345',
          '  Port: 8080',
          '  Uptime: 2h 15m',
          '',
        ]
        break
      
      default:
        if (trimmedCommand.startsWith('echo ')) {
          response = [trimmedCommand.substring(5), '']
        } else {
          response = [`Command not found: ${trimmedCommand}`, 'Type "help" for available commands', '']
        }
    }

    setOutput(prev => [...prev, ...response])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(commandHistory[newIndex])
        }
      }
    }
  }

  const createNewSession = () => {
    const newId = (sessions.length + 1).toString()
    const newSession: TerminalSession = {
      id: newId,
      name: `Terminal ${newId}`,
      isActive: false,
    }
    setSessions(prev => [...prev, newSession])
  }

  const switchSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => ({
      ...session,
      isActive: session.id === sessionId,
    })))
    setActiveSessionId(sessionId)
    // In a real implementation, this would load the session's output
  }

  const closeSession = (sessionId: string) => {
    if (sessions.length === 1) return // Don't close the last session
    
    setSessions(prev => prev.filter(session => session.id !== sessionId))
    
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(session => session.id !== sessionId)
      if (remainingSessions.length > 0) {
        switchSession(remainingSessions[0].id)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Terminal Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center px-4 py-2">
        <div className="flex space-x-2 flex-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center space-x-2 px-3 py-1 rounded-t-lg cursor-pointer ${
                session.id === activeSessionId
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => switchSession(session.id)}
            >
              <span className="text-sm">{session.name}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeSession(session.id)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={createNewSession}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          + New
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col bg-black text-green-400 font-mono">
        {/* Output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-4 space-y-1"
        >
          {output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          
          {/* Input Line */}
          <div className="flex items-center">
            <span className="text-blue-400 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Terminal Info */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Session: {sessions.find(s => s.id === activeSessionId)?.name}</span>
            <span>Commands: {commandHistory.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

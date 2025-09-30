import React, { useState, useEffect } from 'react'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'error' | 'warn' | 'info' | 'debug'
  source: string
  message: string
  metadata?: any
}

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [filters, setFilters] = useState({
    level: 'all',
    source: 'all',
    search: '',
  })
  const [isAutoScroll, setIsAutoScroll] = useState(true)

  useEffect(() => {
    // Load initial logs
    loadLogs()
    
    // Simulate real-time log updates
    const interval = setInterval(() => {
      addNewLog()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = logs

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(log => log.source === filters.source)
    }

    if (filters.search) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }, [logs, filters])

  const loadLogs = () => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000),
        level: 'info',
        source: 'server',
        message: 'Server started successfully on port 8080',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 240000),
        level: 'info',
        source: 'server',
        message: 'Model loaded: llama-2-7b-chat.gguf',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 180000),
        level: 'warn',
        source: 'auth',
        message: 'Failed login attempt from user: testuser',
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 120000),
        level: 'info',
        source: 'chat',
        message: 'New chat session created',
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 60000),
        level: 'error',
        source: 'db',
        message: 'Database connection timeout',
        metadata: { timeout: 5000, retries: 3 },
      },
    ]
    setLogs(mockLogs)
  }

  const addNewLog = () => {
    const sources = ['server', 'auth', 'chat', 'db', 'terminal', 'knowledge']
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug']
    const messages = [
      'Request processed successfully',
      'User session expired',
      'File upload completed',
      'Cache cleared',
      'Configuration updated',
      'Memory usage: 75%',
      'New connection established',
      'Task completed',
    ]

    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    }

    setLogs(prev => [newLog, ...prev])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const exportLogs = () => {
    const logData = filteredLogs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      source: log.source,
      message: log.message,
      metadata: log.metadata,
    }))

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json',
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shimmy-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20'
      case 'warn': return 'text-yellow-400 bg-yellow-900/20'
      case 'info': return 'text-blue-400 bg-blue-900/20'
      case 'debug': return 'text-gray-400 bg-gray-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getLevelBadgeColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-600'
      case 'warn': return 'bg-yellow-600'
      case 'info': return 'bg-blue-600'
      case 'debug': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString()
  }

  const uniqueSources = Array.from(new Set(logs.map(log => log.source)))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">System Logs</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={isAutoScroll}
                onChange={(e) => setIsAutoScroll(e.target.checked)}
                className="mr-2"
              />
              Auto-scroll
            </label>
            <button
              onClick={exportLogs}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Export
            </button>
            <button
              onClick={clearLogs}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search logs..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400">No logs found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`px-4 py-2 border-l-4 ${getLevelColor(log.level)} hover:bg-gray-800/50 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${getLevelBadgeColor(log.level)}`}
                      >
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm font-medium">
                        {log.source}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-white text-sm">{log.message}</p>
                    {log.metadata && (
                      <pre className="text-gray-400 text-xs mt-2 bg-gray-900 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
          <span>
            Last updated: {logs.length > 0 ? formatTimestamp(logs[0].timestamp) : 'Never'}
          </span>
        </div>
      </div>
    </div>
  )
}

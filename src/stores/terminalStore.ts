import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TerminalCommand {
  id: string
  command: string
  output: string
  exitCode: number | null
  timestamp: Date
  duration: number
  isRunning: boolean
}

export interface TerminalSession {
  id: string
  name: string
  workingDirectory: string
  environment: Record<string, string>
  commands: TerminalCommand[]
  isActive: boolean
  createdAt: Date
  lastActivity: Date
}

export interface TerminalTheme {
  name: string
  background: string
  foreground: string
  cursor: string
  selection: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

export interface TerminalState {
  // Sessions
  sessions: TerminalSession[]
  activeSessionId: string | null
  
  // Current session state
  currentCommand: string
  commandHistory: string[]
  historyIndex: number
  
  // UI state
  isVisible: boolean
  fontSize: number
  theme: TerminalTheme
  showTimestamps: boolean
  maxHistorySize: number
  
  // Process management
  runningProcesses: Map<string, AbortController>
  
  // Actions
  createSession: (name?: string, workingDir?: string) => string
  deleteSession: (sessionId: string) => void
  switchSession: (sessionId: string) => void
  
  // Command execution
  executeCommand: (command: string, sessionId?: string) => Promise<void>
  cancelCommand: (commandId: string) => void
  
  // Command history
  addToHistory: (command: string) => void
  navigateHistory: (direction: 'up' | 'down') => string
  clearHistory: () => void
  
  // Terminal control
  setCurrentCommand: (command: string) => void
  toggleVisibility: () => void
  setFontSize: (size: number) => void
  setTheme: (theme: TerminalTheme) => void
  
  // Utilities
  getActiveSession: () => TerminalSession | null
  clearSession: (sessionId: string) => void
  exportSession: (sessionId: string) => string
}

// Default terminal themes
export const TERMINAL_THEMES: Record<string, TerminalTheme> = {
  dark: {
    name: 'Dark',
    background: '#1a1a1a',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#444444',
    black: '#000000',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#555555',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff'
  },
  light: {
    name: 'Light',
    background: '#ffffff',
    foreground: '#000000',
    cursor: '#000000',
    selection: '#cccccc',
    black: '#000000',
    red: '#cc0000',
    green: '#4e9a06',
    yellow: '#c4a000',
    blue: '#3465a4',
    magenta: '#75507b',
    cyan: '#06989a',
    white: '#d3d7cf',
    brightBlack: '#555753',
    brightRed: '#ef2929',
    brightGreen: '#8ae234',
    brightYellow: '#fce94f',
    brightBlue: '#729fcf',
    brightMagenta: '#ad7fa8',
    brightCyan: '#34e2e2',
    brightWhite: '#eeeeec'
  },
  matrix: {
    name: 'Matrix',
    background: '#000000',
    foreground: '#00ff00',
    cursor: '#00ff00',
    selection: '#003300',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#555555',
    brightRed: '#ff5555',
    brightGreen: '#55ff55',
    brightYellow: '#ffff55',
    brightBlue: '#5555ff',
    brightMagenta: '#ff55ff',
    brightCyan: '#55ffff',
    brightWhite: '#ffffff'
  }
}

// Real command execution using Electron IPC
const executeSystemCommand = async (command: string, workingDir: string): Promise<{ output: string; exitCode: number }> => {
  try {
    if (window.electronAPI) {
      // Use real terminal execution through Electron
      const result = await window.electronAPI.terminal.create({
        command,
        cwd: workingDir
      })

      return {
        output: result.output || '',
        exitCode: result.exitCode || 0
      }
    } else {
      // Fallback for web development - limited built-in commands
      const cmd = command.trim().toLowerCase()

      if (cmd === 'pwd') {
        return { output: workingDir, exitCode: 0 }
      }

      if (cmd === 'date') {
        return { output: new Date().toString(), exitCode: 0 }
      }

      if (cmd.startsWith('echo ')) {
        return { output: cmd.substring(5), exitCode: 0 }
      }

      if (cmd === 'clear' || cmd === 'cls') {
        return { output: '\x1b[2J\x1b[H', exitCode: 0 }
      }

      return {
        output: `Command '${command}' not available in web mode. Please use Electron version for full terminal functionality.`,
        exitCode: 1
      }
    }
  } catch (error) {
    return {
      output: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      exitCode: 1
    }
  }
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      activeSessionId: null,
      currentCommand: '',
      commandHistory: [],
      historyIndex: -1,
      isVisible: false,
      fontSize: 14,
      theme: TERMINAL_THEMES.dark,
      showTimestamps: true,
      maxHistorySize: 1000,
      runningProcesses: new Map(),

      // Create new session
      createSession: (name, workingDir = '/home/shimmy') => {
        const sessionId = crypto.randomUUID()
        const newSession: TerminalSession = {
          id: sessionId,
          name: name || `Session ${get().sessions.length + 1}`,
          workingDirectory: workingDir,
          environment: {
            PATH: '/usr/local/bin:/usr/bin:/bin',
            HOME: '/home/shimmy',
            USER: 'shimmy',
            SHELL: '/bin/bash'
          },
          commands: [],
          isActive: true,
          createdAt: new Date(),
          lastActivity: new Date()
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

      // Execute command
      executeCommand: async (command, sessionId) => {
        const targetSessionId = sessionId || get().activeSessionId
        if (!targetSessionId) return

        const commandId = crypto.randomUUID()
        const startTime = Date.now()
        
        // Create abort controller for cancellation
        const abortController = new AbortController()
        get().runningProcesses.set(commandId, abortController)

        // Add command to session
        const newCommand: TerminalCommand = {
          id: commandId,
          command,
          output: '',
          exitCode: null,
          timestamp: new Date(),
          duration: 0,
          isRunning: true
        }

        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  commands: [...session.commands, newCommand],
                  lastActivity: new Date()
                }
              : session
          )
        }))

        try {
          // Execute the command
          const session = get().sessions.find(s => s.id === targetSessionId)
          if (!session) return

          const result = await executeSystemCommand(command, session.workingDirectory)
          const endTime = Date.now()

          // Update command with result
          set(state => ({
            sessions: state.sessions.map(session =>
              session.id === targetSessionId
                ? {
                    ...session,
                    commands: session.commands.map(cmd =>
                      cmd.id === commandId
                        ? {
                            ...cmd,
                            output: result.output,
                            exitCode: result.exitCode,
                            duration: endTime - startTime,
                            isRunning: false
                          }
                        : cmd
                    )
                  }
                : session
            )
          }))

          // Add to history
          get().addToHistory(command)

        } catch (error) {
          // Handle execution error
          const endTime = Date.now()
          
          set(state => ({
            sessions: state.sessions.map(session =>
              session.id === targetSessionId
                ? {
                    ...session,
                    commands: session.commands.map(cmd =>
                      cmd.id === commandId
                        ? {
                            ...cmd,
                            output: `Error: ${error}`,
                            exitCode: 1,
                            duration: endTime - startTime,
                            isRunning: false
                          }
                        : cmd
                    )
                  }
                : session
            )
          }))
        } finally {
          // Clean up
          get().runningProcesses.delete(commandId)
        }
      },

      // Cancel running command
      cancelCommand: (commandId) => {
        const abortController = get().runningProcesses.get(commandId)
        if (abortController) {
          abortController.abort()
          get().runningProcesses.delete(commandId)
        }

        // Update command status
        set(state => ({
          sessions: state.sessions.map(session => ({
            ...session,
            commands: session.commands.map(cmd =>
              cmd.id === commandId
                ? {
                    ...cmd,
                    output: cmd.output + '\n^C',
                    exitCode: 130,
                    isRunning: false
                  }
                : cmd
            )
          }))
        }))
      },

      // Add command to history
      addToHistory: (command) => {
        set(state => {
          const trimmedCommand = command.trim()
          if (!trimmedCommand || trimmedCommand === state.commandHistory[state.commandHistory.length - 1]) {
            return state
          }

          const newHistory = [...state.commandHistory, trimmedCommand]
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift()
          }

          return {
            commandHistory: newHistory,
            historyIndex: -1
          }
        })
      },

      // Navigate command history
      navigateHistory: (direction) => {
        const { commandHistory, historyIndex } = get()
        
        if (commandHistory.length === 0) return ''

        let newIndex = historyIndex
        
        if (direction === 'up') {
          newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        } else {
          newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1)
          if (newIndex === commandHistory.length - 1 && historyIndex === commandHistory.length - 1) {
            newIndex = -1
          }
        }

        set({ historyIndex: newIndex })
        
        return newIndex === -1 ? '' : commandHistory[newIndex]
      },

      // Clear command history
      clearHistory: () => {
        set({ commandHistory: [], historyIndex: -1 })
      },

      // Set current command
      setCurrentCommand: (command) => {
        set({ currentCommand: command })
      },

      // Toggle terminal visibility
      toggleVisibility: () => {
        set(state => ({ isVisible: !state.isVisible }))
      },

      // Set font size
      setFontSize: (size) => {
        set({ fontSize: Math.max(8, Math.min(32, size)) })
      },

      // Set theme
      setTheme: (theme) => {
        set({ theme })
      },

      // Get active session
      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find(s => s.id === activeSessionId) || null
      },

      // Clear session commands
      clearSession: (sessionId) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, commands: [] }
              : session
          )
        }))
      },

      // Export session
      exportSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (!session) return ''

        const lines = [
          `# Terminal Session: ${session.name}`,
          `# Created: ${session.createdAt.toISOString()}`,
          `# Working Directory: ${session.workingDirectory}`,
          '',
          ...session.commands.map(cmd => {
            const timestamp = cmd.timestamp.toLocaleTimeString()
            const duration = cmd.duration > 0 ? ` (${cmd.duration}ms)` : ''
            return [
              `# [${timestamp}] $ ${cmd.command}${duration}`,
              cmd.output,
              cmd.exitCode !== 0 ? `# Exit code: ${cmd.exitCode}` : '',
              ''
            ].filter(Boolean).join('\n')
          })
        ]

        return lines.join('\n')
      }
    }),
    {
      name: 'terminal-store',
      partialize: (state) => ({
        commandHistory: state.commandHistory,
        fontSize: state.fontSize,
        theme: state.theme,
        showTimestamps: state.showTimestamps,
        maxHistorySize: state.maxHistorySize
      })
    }
  )
)

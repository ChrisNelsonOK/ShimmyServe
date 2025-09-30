import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Shimmy server management
  shimmy: {
    start: (configId?: string) => ipcRenderer.invoke('shimmy:start', configId),
    stop: () => ipcRenderer.invoke('shimmy:stop'),
    status: () => ipcRenderer.invoke('shimmy:status'),
    chat: (request: any) => ipcRenderer.invoke('shimmy:chat', request),

    // Event listeners
    onStarted: (callback: (config: any) => void) => {
      ipcRenderer.on('shimmy:started', (_, config) => callback(config))
    },
    onStopped: (callback: () => void) => {
      ipcRenderer.on('shimmy:stopped', () => callback())
    },
    onError: (callback: (error: any) => void) => {
      ipcRenderer.on('shimmy:error', (_, error) => callback(error))
    },
    onStdout: (callback: (data: string) => void) => {
      ipcRenderer.on('shimmy:stdout', (_, data) => callback(data))
    },
    onStderr: (callback: (data: string) => void) => {
      ipcRenderer.on('shimmy:stderr', (_, data) => callback(data))
    },
  },

  // Terminal API
  terminal: {
    create: (options: any) => ipcRenderer.invoke('terminal:create', options),
    write: (sessionId: string, data: string) => ipcRenderer.invoke('terminal:write', sessionId, data),
    resize: (sessionId: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', sessionId, cols, rows),
    kill: (sessionId: string) => ipcRenderer.invoke('terminal:kill', sessionId),

    // Event listeners
    onData: (callback: (data: any) => void) => {
      ipcRenderer.on('terminal:data', (_, data) => callback(data))
    },
    onExit: (callback: (data: any) => void) => {
      ipcRenderer.on('terminal:exit', (_, data) => callback(data))
    },
  },

  // Database API
  database: {
    // Auth
    login: (credentials: any) => ipcRenderer.invoke('db:login', credentials),
    register: (userData: any) => ipcRenderer.invoke('db:register', userData),
    logout: () => ipcRenderer.invoke('db:logout'),
    updatePassword: (data: any) => ipcRenderer.invoke('db:updatePassword', data),

    // Server configs
    getServerConfigs: () => ipcRenderer.invoke('db:getServerConfigs'),
    createServerConfig: (config: any) => ipcRenderer.invoke('db:createServerConfig', config),
    updateServerConfig: (id: string, config: any) => ipcRenderer.invoke('db:updateServerConfig', id, config),
    deleteServerConfig: (id: string) => ipcRenderer.invoke('db:deleteServerConfig', id),

    // Conversations
    getConversations: () => ipcRenderer.invoke('db:getConversations'),
    createConversation: (title: string) => ipcRenderer.invoke('db:createConversation', title),
    getMessages: (conversationId: string) => ipcRenderer.invoke('db:getMessages', conversationId),
    addMessage: (message: any) => ipcRenderer.invoke('db:addMessage', message),

    // Knowledge base
    getDocuments: () => ipcRenderer.invoke('db:getDocuments'),
    uploadDocument: (filePath: string) => ipcRenderer.invoke('db:uploadDocument', filePath),
    deleteDocument: (id: string) => ipcRenderer.invoke('db:deleteDocument', id),
    searchDocuments: (query: string) => ipcRenderer.invoke('db:searchDocuments', query),

    // Logs
    getLogs: (filters?: any) => ipcRenderer.invoke('db:getLogs', filters),
    clearLogs: () => ipcRenderer.invoke('db:clearLogs'),
    exportLogs: (format: string) => ipcRenderer.invoke('db:exportLogs', format),
  },

  // File dialogs
  dialog: {
    selectModelFile: () => ipcRenderer.invoke('dialog:selectModelFile'),
    selectDocuments: () => ipcRenderer.invoke('dialog:selectDocuments'),
  },

  // System info
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    getStats: () => ipcRenderer.invoke('system:getStats'),
  },

  // Logging
  logging: {
    onNewLog: (callback: (log: any) => void) => {
      ipcRenderer.on('logging:newLog', (_, log) => callback(log))
    },
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})

// Type definitions for the exposed API
export interface ElectronAPI {
  shimmy: {
    start: (configId?: string) => Promise<any>
    stop: () => Promise<any>
    status: () => Promise<any>
    chat: (request: any) => Promise<any>
    onStarted: (callback: (config: any) => void) => void
    onStopped: (callback: () => void) => void
    onError: (callback: (error: any) => void) => void
    onStdout: (callback: (data: string) => void) => void
    onStderr: (callback: (data: string) => void) => void
  }
  terminal: {
    create: (options: any) => Promise<any>
    write: (sessionId: string, data: string) => Promise<any>
    resize: (sessionId: string, cols: number, rows: number) => Promise<any>
    kill: (sessionId: string) => Promise<any>
    onData: (callback: (data: any) => void) => void
    onExit: (callback: (data: any) => void) => void
  }
  database: {
    login: (credentials: any) => Promise<any>
    register: (userData: any) => Promise<any>
    logout: () => Promise<any>
    updatePassword: (data: any) => Promise<any>
    getServerConfigs: () => Promise<any>
    createServerConfig: (config: any) => Promise<any>
    updateServerConfig: (id: string, config: any) => Promise<any>
    deleteServerConfig: (id: string) => Promise<any>
    getConversations: () => Promise<any>
    createConversation: (title: string) => Promise<any>
    getMessages: (conversationId: string) => Promise<any>
    addMessage: (message: any) => Promise<any>
    getDocuments: () => Promise<any>
    uploadDocument: (filePath: string) => Promise<any>
    deleteDocument: (id: string) => Promise<any>
    searchDocuments: (query: string) => Promise<any>
    getLogs: (filters?: any) => Promise<any>
    clearLogs: () => Promise<any>
    exportLogs: (format: string) => Promise<any>
  }
  dialog: {
    selectModelFile: () => Promise<any>
    selectDocuments: () => Promise<any>
  }
  system: {
    getInfo: () => Promise<any>
    getStats: () => Promise<any>
  }
  logging: {
    onNewLog: (callback: (log: any) => void) => void
  }
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

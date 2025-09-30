import { create } from 'zustand'
import { getElectronAPI, isElectron } from '../lib/utils'

interface ShimmyStatus {
  running: boolean
  pid: number | null
}

interface ShimmyConfig {
  port: number
  host: string
  modelPath?: string
  gpuLayers?: number
  contextSize?: number
  batchSize?: number
}

interface ShimmyStore {
  status: ShimmyStatus
  config: ShimmyConfig
  isLoading: boolean
  error: string | null
  
  // Actions
  startServer: (config?: Partial<ShimmyConfig>) => Promise<void>
  stopServer: () => Promise<void>
  checkStatus: () => Promise<void>
  updateConfig: (config: Partial<ShimmyConfig>) => void
  clearError: () => void
}

const defaultConfig: ShimmyConfig = {
  port: 11435,
  host: '127.0.0.1',
  contextSize: 2048,
  batchSize: 512,
  gpuLayers: 0
}

export const useShimmyStore = create<ShimmyStore>((set, get) => ({
  status: { running: false, pid: null },
  config: defaultConfig,
  isLoading: false,
  error: null,

  startServer: async (configOverrides = {}) => {
    set({ isLoading: true, error: null })

    try {
      if (isElectron()) {
        const electronAPI = getElectronAPI()
        const config = { ...get().config, ...configOverrides }
        const result = await electronAPI.shimmy.start(config)

        if (result.success) {
          await get().checkStatus()
        } else {
          set({ error: result.error || 'Failed to start server' })
        }
      } else {
        set({ error: 'Server management requires Electron environment' })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      set({ isLoading: false })
    }
  },

  stopServer: async () => {
    set({ isLoading: true, error: null })

    try {
      if (isElectron()) {
        const electronAPI = getElectronAPI()
        const result = await electronAPI.shimmy.stop()

        if (result.success) {
          set({ status: { running: false, pid: null } })
        } else {
          set({ error: result.error || 'Failed to stop server' })
        }
      } else {
        set({ error: 'Server management requires Electron environment' })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      set({ isLoading: false })
    }
  },

  checkStatus: async () => {
    try {
      if (isElectron()) {
        const electronAPI = getElectronAPI()
        const status = await electronAPI.shimmy.status()
        set({ status: { running: status.running, pid: status.pid } })
      } else {
        set({ error: 'Server status check requires Electron environment' })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  updateConfig: (configUpdates) => {
    set(state => ({
      config: { ...state.config, ...configUpdates }
    }))
  },

  clearError: () => {
    set({ error: null })
  }
}))

import { create } from 'zustand'
import { getElectronAPI, isElectron } from '../lib/utils'

interface SystemInfo {
  platform: string
  arch: string
  version: string
  electronVersion: string
  chromeVersion: string
  nodeVersion: string
}

interface SystemStore {
  systemInfo: SystemInfo | null
  isElectron: boolean
  fetchSystemInfo: () => Promise<void>
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  systemInfo: null,
  isElectron: isElectron(),

  fetchSystemInfo: async () => {
    try {
      if (isElectron()) {
        const electronAPI = getElectronAPI()
        const info = await electronAPI.system.getInfo()
        set({ systemInfo: info })
      } else {
        // Fallback for web development - use browser info
        set({
          systemInfo: {
            platform: navigator.platform,
            arch: 'unknown',
            version: navigator.userAgent,
            electronVersion: 'N/A',
            chromeVersion: 'N/A',
            nodeVersion: 'N/A'
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error)
    }
  }
}))

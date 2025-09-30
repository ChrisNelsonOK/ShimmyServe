import React, { useState, useEffect } from 'react'

interface ServerConfig {
  id: string
  name: string
  host: string
  port: number
  modelPath?: string
  maxTokens: number
  temperature: number
  topP: number
  topK: number
  isActive: boolean
}

interface ServerStatus {
  isRunning: boolean
  pid?: number
  uptime?: number
  lastError?: string
}

export function ServerManagement() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ isRunning: false })
  const [configs, setConfigs] = useState<ServerConfig[]>([])
  const [activeConfig, setActiveConfig] = useState<ServerConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [formData, setFormData] = useState<Partial<ServerConfig>>({
    name: '',
    host: 'localhost',
    port: 8080,
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  })

  useEffect(() => {
    // Load server configurations and status
    loadConfigurations()
    loadServerStatus()

    // Set up polling for server status
    const statusInterval = setInterval(loadServerStatus, 5000)
    return () => clearInterval(statusInterval)
  }, [])

  const loadConfigurations = async () => {
    // This would be replaced with actual API calls
    const mockConfigs: ServerConfig[] = [
      {
        id: '1',
        name: 'Default Configuration',
        host: 'localhost',
        port: 8080,
        modelPath: '/models/llama-2-7b-chat.gguf',
        maxTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        isActive: true,
      },
      {
        id: '2',
        name: 'High Performance',
        host: 'localhost',
        port: 8081,
        modelPath: '/models/llama-2-13b-chat.gguf',
        maxTokens: 4096,
        temperature: 0.5,
        topP: 0.95,
        topK: 50,
        isActive: false,
      },
    ]
    setConfigs(mockConfigs)
    setActiveConfig(mockConfigs.find(c => c.isActive) || null)
  }

  const loadServerStatus = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.shimmy.status()
        setServerStatus({
          isRunning: status.running,
          pid: status.pid,
          uptime: status.uptime || 0,
        })
      }
    } catch (error) {
      console.error('Failed to load server status:', error)
    }
  }

  const handleStartServer = async (configId?: string) => {
    setIsLoading(true)
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.shimmy.start(configId)
        if (result.success) {
          await loadServerStatus()
        } else {
          console.error('Failed to start server:', result.error)
        }
      }
    } catch (error) {
      console.error('Failed to start server:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopServer = async () => {
    setIsLoading(true)
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.shimmy.stop()
        if (result.success) {
          await loadServerStatus()
        } else {
          console.error('Failed to stop server:', result.error)
        }
      }
    } catch (error) {
      console.error('Failed to stop server:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!formData.name || !formData.host || !formData.port) {
      alert('Please fill in all required fields')
      return
    }

    const newConfig: ServerConfig = {
      id: Date.now().toString(),
      name: formData.name!,
      host: formData.host!,
      port: formData.port!,
      modelPath: formData.modelPath,
      maxTokens: formData.maxTokens || 2048,
      temperature: formData.temperature || 0.7,
      topP: formData.topP || 0.9,
      topK: formData.topK || 40,
      isActive: false,
    }

    setConfigs([...configs, newConfig])
    setShowConfigForm(false)
    setFormData({
      name: '',
      host: 'localhost',
      port: 8080,
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    })
  }

  const handleSetActiveConfig = async (configId: string) => {
    const updatedConfigs = configs.map(config => ({
      ...config,
      isActive: config.id === configId,
    }))
    setConfigs(updatedConfigs)
    setActiveConfig(updatedConfigs.find(c => c.id === configId) || null)
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Server Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Server Status</h2>
          <div className={`flex items-center space-x-2 ${
            serverStatus.isRunning ? 'text-green-400' : 'text-red-400'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              serverStatus.isRunning ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">
              {serverStatus.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Process ID</h3>
            <p className="text-lg font-semibold text-white">
              {serverStatus.pid || 'N/A'}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Uptime</h3>
            <p className="text-lg font-semibold text-white">
              {serverStatus.uptime ? formatUptime(serverStatus.uptime) : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Configuration</h3>
            <p className="text-lg font-semibold text-white">
              {activeConfig?.name || 'None'}
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleStartServer()}
            disabled={serverStatus.isRunning || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Starting...' : 'Start Server'}
          </button>
          <button
            onClick={handleStopServer}
            disabled={!serverStatus.isRunning || isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Stopping...' : 'Stop Server'}
          </button>
          <button
            onClick={() => loadServerStatus()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Server Configurations */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Server Configurations</h2>
          <button
            onClick={() => setShowConfigForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Configuration
          </button>
        </div>

        <div className="space-y-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`bg-gray-700 rounded-lg p-4 border-2 ${
                config.isActive ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                <div className="flex items-center space-x-2">
                  {config.isActive && (
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => handleSetActiveConfig(config.id)}
                    disabled={config.isActive}
                    className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Set Active
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Host:</span>
                  <span className="text-white ml-2">{config.host}:{config.port}</span>
                </div>
                <div>
                  <span className="text-gray-400">Max Tokens:</span>
                  <span className="text-white ml-2">{config.maxTokens}</span>
                </div>
                <div>
                  <span className="text-gray-400">Temperature:</span>
                  <span className="text-white ml-2">{config.temperature}</span>
                </div>
                <div>
                  <span className="text-gray-400">Top-P:</span>
                  <span className="text-white ml-2">{config.topP}</span>
                </div>
              </div>

              {config.modelPath && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white ml-2">{config.modelPath}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Form Modal */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Configuration Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="My Configuration"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Host *
                  </label>
                  <input
                    type="text"
                    value={formData.host || ''}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={formData.port || ''}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Model Path
                </label>
                <input
                  type="text"
                  value={formData.modelPath || ''}
                  onChange={(e) => setFormData({ ...formData, modelPath: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="/path/to/model.gguf"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={formData.maxTokens || ''}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature || ''}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowConfigForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

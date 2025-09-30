import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Server, Play, Square, Settings, RefreshCw, Layers, Database, Wifi } from 'lucide-react'
import { useShimmyStore } from '../stores/shimmyStore'
import { cn } from '../lib/utils'
import ServerConfig from './ServerConfig'
import ModelManager from './ModelManager'
import shimmyService from '../lib/shimmy/service'

type TabType = 'overview' | 'config' | 'models'

export default function ServerManagement() {
  const { status, config, isLoading, error, startServer, stopServer, updateConfig, clearError } = useShimmyStore()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [serviceStatus, setServiceStatus] = useState(shimmyService.getStatus())

  useEffect(() => {
    // Listen for service status updates
    const handleStatusUpdate = (status: any) => {
      setServiceStatus(status)
    }

    shimmyService.on('statusUpdated', handleStatusUpdate)

    return () => {
      shimmyService.off('statusUpdated', handleStatusUpdate)
    }
  }, [])

  const handleStart = async () => {
    await startServer()
  }

  const handleStop = async () => {
    await stopServer()
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Server },
    { id: 'config' as TabType, label: 'Configuration', icon: Settings },
    { id: 'models' as TabType, label: 'Models', icon: Database },
  ]

  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Server Management</h1>
            <p className="text-muted-foreground mt-1">
              Control and configure your Shimmy inference server
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                serviceStatus.isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {serviceStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300 capitalize">
                {serviceStatus.mode} Mode
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-red-400">{error}</p>
                    <button
                      onClick={clearError}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Service Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Connection Status */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Connection</h3>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      serviceStatus.isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )} />
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {serviceStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Mode: {serviceStatus.mode}
                  </p>
                </div>

                {/* Server Info */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Server</h3>
                    <Server className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {serviceStatus.serverInfo?.status || 'Unknown'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {serviceStatus.serverInfo?.host}:{serviceStatus.serverInfo?.port}
                  </p>
                </div>

                {/* Models */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Models</h3>
                    <Database className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {serviceStatus.models?.length || 0}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Available models
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('config')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configure Server
                  </button>

                  <button
                    onClick={() => setActiveTab('models')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    Manage Models
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ServerConfig />
            </motion.div>
          )}

          {activeTab === 'models' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ModelManager />
            </motion.div>
          )}
        </div>


      </motion.div>
    </div>
  )
}

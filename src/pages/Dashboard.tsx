import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface ServerStatus {
  isRunning: boolean
  uptime?: number
  model?: string
  port?: number
}

interface SystemStats {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

export function Dashboard() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isRunning: false
  })
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0
  })
  const [recentActivity, setRecentActivity] = useState<string[]>([])

  useEffect(() => {
    // Simulate fetching server status
    const fetchServerStatus = () => {
      // This would be replaced with actual API calls
      setServerStatus({
        isRunning: Math.random() > 0.5,
        uptime: Math.floor(Math.random() * 86400),
        model: 'llama-2-7b-chat',
        port: 8080
      })
    }

    // Simulate fetching system stats
    const fetchSystemStats = () => {
      setSystemStats({
        cpuUsage: Math.floor(Math.random() * 100),
        memoryUsage: Math.floor(Math.random() * 100),
        diskUsage: Math.floor(Math.random() * 100)
      })
    }

    // Simulate recent activity
    const fetchRecentActivity = () => {
      const activities = [
        'Server started successfully',
        'Model loaded: llama-2-7b-chat',
        'New chat session initiated',
        'Document uploaded to knowledge base',
        'Terminal session created',
        'Configuration updated'
      ]
      setRecentActivity(activities.slice(0, 5))
    }

    fetchServerStatus()
    fetchSystemStats()
    fetchRecentActivity()

    // Set up intervals for real-time updates
    const statusInterval = setInterval(fetchServerStatus, 5000)
    const statsInterval = setInterval(fetchSystemStats, 2000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(statsInterval)
    }
  }, [])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getStatusColor = (isRunning: boolean) => {
    return isRunning ? 'text-green-400' : 'text-red-400'
  }

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500'
    if (usage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to ShimmyServe</h1>
        <p className="text-gray-400">
          Your AI-powered desktop application for managing Shimmy inference servers.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Server Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Server Status</h3>
            <div className={`w-3 h-3 rounded-full ${serverStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <p className={`text-sm font-medium ${getStatusColor(serverStatus.isRunning)}`}>
            {serverStatus.isRunning ? 'Running' : 'Stopped'}
          </p>
          {serverStatus.isRunning && serverStatus.uptime && (
            <p className="text-xs text-gray-400 mt-1">
              Uptime: {formatUptime(serverStatus.uptime)}
            </p>
          )}
        </div>

        {/* Active Model */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Model</h3>
          <p className="text-sm text-blue-400 font-medium">
            {serverStatus.model || 'No model loaded'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Port: {serverStatus.port || 'N/A'}
          </p>
        </div>

        {/* CPU Usage */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">CPU Usage</h3>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
              <div
                className={`h-2 rounded-full ${getUsageColor(systemStats.cpuUsage)}`}
                style={{ width: `${systemStats.cpuUsage}%` }}
              ></div>
            </div>
            <span className="text-sm text-white font-medium">{systemStats.cpuUsage}%</span>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Memory Usage</h3>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
              <div
                className={`h-2 rounded-full ${getUsageColor(systemStats.memoryUsage)}`}
                style={{ width: `${systemStats.memoryUsage}%` }}
              ></div>
            </div>
            <span className="text-sm text-white font-medium">{systemStats.memoryUsage}%</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/server"
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🖥️</div>
              <div className="text-sm font-medium">Manage Server</div>
            </Link>
            <Link
              to="/chat"
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm font-medium">Start Chat</div>
            </Link>
            <Link
              to="/knowledge"
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm font-medium">Knowledge Base</div>
            </Link>
            <Link
              to="/terminal"
              className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium">Terminal</div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-300">{activity}</span>
              </div>
            ))}
          </div>
          <Link
            to="/logs"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View all logs →
          </Link>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Platform</h4>
            <p className="text-white">{navigator.platform}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">User Agent</h4>
            <p className="text-white text-sm truncate">{navigator.userAgent.split(' ')[0]}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Language</h4>
            <p className="text-white">{navigator.language}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

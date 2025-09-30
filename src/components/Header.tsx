import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Bell,
  Search,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'
import { useShimmyStore } from '../stores/shimmyStore'
import { useSystemStore } from '../stores/systemStore'
import { cn, formatBytes } from '../lib/utils'

export default function Header() {
  const { status, checkStatus } = useShimmyStore()
  const { systemInfo } = useSystemStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0
  })

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check Shimmy status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus()
    }, 5000)
    return () => clearInterval(interval)
  }, [checkStatus])

  // Mock system stats (in real implementation, this would come from system monitoring)
  useEffect(() => {
    const updateStats = () => {
      setSystemStats({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100
      })
    }
    
    updateStats()
    const interval = setInterval(updateStats, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Center Section - System Stats */}
        <div className="flex items-center space-x-6">
          {/* Shimmy Status */}
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status.running ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-sm font-medium">
              Shimmy {status.running ? 'Online' : 'Offline'}
            </span>
            {status.running && status.pid && (
              <span className="text-xs text-muted-foreground">
                PID: {status.pid}
              </span>
            )}
          </div>

          {/* System Stats */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>{systemStats.cpu.toFixed(1)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-400" />
              <span>{systemStats.memory.toFixed(1)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <HardDrive className="w-4 h-4 text-yellow-400" />
              <span>{systemStats.disk.toFixed(1)}%</span>
            </div>
          </div>

          {/* Network Status */}
          <div className="flex items-center space-x-1">
            {status.running ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm">
              {status.running ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Right Section - Time & Controls */}
        <div className="flex items-center space-x-4">
          {/* System Info */}
          {systemInfo && (
            <div className="text-sm text-muted-foreground">
              <span>{systemInfo.platform}</span>
              <span className="mx-1">•</span>
              <span>{systemInfo.arch}</span>
            </div>
          )}

          {/* Current Time */}
          <div className="text-sm font-mono">
            {currentTime.toLocaleTimeString()}
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell className="w-4 h-4" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">3</span>
            </div>
          </button>

          {/* Window Controls (macOS style) */}
          <div className="flex items-center space-x-2 ml-4">
            <button className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors" />
            <button className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors" />
            <button className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        className="mt-4 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
      />
    </header>
  )
}

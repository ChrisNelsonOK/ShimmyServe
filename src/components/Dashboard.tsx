import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Server,
  Zap,
  Database,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'
import { useShimmyStore } from '../stores/shimmyStore'
import { cn, formatBytes, formatDuration } from '../lib/utils'

interface MetricCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<any>
  color: string
}

export default function Dashboard() {
  const { status, checkStatus } = useShimmyStore()
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    checkStatus()
    
    // Mock metrics data
    setMetrics([
      {
        title: 'Server Status',
        value: status.running ? 'Online' : 'Offline',
        change: status.running ? '+100%' : '0%',
        trend: status.running ? 'up' : 'down',
        icon: Server,
        color: status.running ? 'text-green-400' : 'text-red-400'
      },
      {
        title: 'Active Connections',
        value: status.running ? '12' : '0',
        change: '+8.2%',
        trend: 'up',
        icon: Users,
        color: 'text-blue-400'
      },
      {
        title: 'Requests/min',
        value: status.running ? '247' : '0',
        change: '+12.5%',
        trend: 'up',
        icon: MessageSquare,
        color: 'text-purple-400'
      },
      {
        title: 'Response Time',
        value: status.running ? '145ms' : 'N/A',
        change: '-5.3%',
        trend: 'up',
        icon: Clock,
        color: 'text-yellow-400'
      },
      {
        title: 'Memory Usage',
        value: '2.4 GB',
        change: '+2.1%',
        trend: 'up',
        icon: HardDrive,
        color: 'text-orange-400'
      },
      {
        title: 'CPU Usage',
        value: '34.2%',
        change: '-1.8%',
        trend: 'down',
        icon: Cpu,
        color: 'text-cyan-400'
      }
    ])

    // Mock recent activity
    setRecentActivity([
      { time: '2 min ago', event: 'Model loaded: Llama-3.2-1B-Instruct', type: 'info' },
      { time: '5 min ago', event: 'Server started on port 11435', type: 'success' },
      { time: '8 min ago', event: 'Configuration updated', type: 'info' },
      { time: '12 min ago', event: 'New client connected', type: 'info' },
      { time: '15 min ago', event: 'GPU acceleration enabled', type: 'success' }
    ])
  }, [status, checkStatus])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your Shimmy AI inference server performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              status.running ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-sm font-medium">
              {status.running ? 'System Operational' : 'System Offline'}
            </span>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.title}
                whileHover={{ scale: 1.02 }}
                className="bg-card border border-border rounded-xl p-6 glass"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-lg bg-background", metric.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={cn(
                    "flex items-center text-sm",
                    metric.trend === 'up' ? 'text-green-400' : 
                    metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  )}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {metric.change}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {metric.value}
                  </h3>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Performance</h3>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            
            {/* Mock chart */}
            <div className="space-y-4">
              {['CPU', 'Memory', 'Network', 'Disk'].map((label, index) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground">{Math.floor(Math.random() * 100)}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.floor(Math.random() * 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                    activity.type === 'success' ? 'bg-green-400' :
                    activity.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.event}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Start Server', icon: Zap, color: 'bg-green-500' },
              { label: 'View Logs', icon: Activity, color: 'bg-blue-500' },
              { label: 'Manage Models', icon: Database, color: 'bg-purple-500' },
              { label: 'Open Terminal', icon: Server, color: 'bg-orange-500' }
            ].map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center p-4 rounded-lg bg-background hover:bg-accent transition-colors"
                >
                  <div className={cn("p-3 rounded-lg mb-2", action.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

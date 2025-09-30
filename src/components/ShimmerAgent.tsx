import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Play, Square, Settings, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Code, Monitor, Shield, FileText,
  Brain, Lightbulb, Target, Activity, BarChart3, X,
  ChevronRight, Download, RotateCcw, Trash2
} from 'lucide-react'
import { useShimmerStore, ShimmerTask, ShimmerInsight, ShimmerRecommendation } from '../stores/shimmerStore'
import { useAuthStore } from '../stores/authStore'
import { cn, formatDuration } from '../lib/utils'

export default function ShimmerAgent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'insights' | 'recommendations' | 'settings'>('overview')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskType, setNewTaskType] = useState<string>('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  const {
    isActive,
    isProcessing,
    capabilities,
    tasks,
    activeTasks,
    taskHistory,
    insights,
    recommendations,
    settings,
    metrics,
    activateAgent,
    deactivateAgent,
    createTask,
    executeTask,
    cancelTask,
    getTasksByStatus,
    clearTaskHistory,
    generateInsights,
    dismissInsight,
    executeInsightAction,
    generateRecommendations,
    implementRecommendation,
    updateSettings,
    resetMetrics
  } = useShimmerStore()

  const { canAccessFeature } = useAuthStore()

  // Auto-generate insights periodically when active
  useEffect(() => {
    if (isActive && settings.proactiveInsights) {
      const interval = setInterval(() => {
        generateInsights()
      }, settings.analysisInterval * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [isActive, settings.proactiveInsights, settings.analysisInterval, generateInsights])

  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !newTaskType) return

    const taskId = createTask(
      newTaskType as any,
      newTaskTitle,
      newTaskDescription || `Execute ${newTaskType} task`
    )

    // Auto-execute the task
    executeTask(taskId)

    // Reset form
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskType('')
    setShowTaskModal(false)
  }

  const getTaskIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'system-monitoring': <Monitor className="w-4 h-4" />,
      'code-generation': <Code className="w-4 h-4" />,
      'log-analysis': <FileText className="w-4 h-4" />,
      'performance-optimization': <TrendingUp className="w-4 h-4" />,
      'troubleshooting': <AlertTriangle className="w-4 h-4" />,
      'documentation': <FileText className="w-4 h-4" />,
      'automation': <Zap className="w-4 h-4" />,
      'security-analysis': <Shield className="w-4 h-4" />
    }
    return icons[type] || <Activity className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-400',
      running: 'text-blue-400',
      completed: 'text-green-400',
      failed: 'text-red-400',
      cancelled: 'text-gray-400'
    }
    return colors[status] || 'text-gray-400'
  }

  const getInsightIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
      error: <AlertTriangle className="w-4 h-4 text-red-400" />,
      info: <CheckCircle className="w-4 h-4 text-blue-400" />,
      success: <CheckCircle className="w-4 h-4 text-green-400" />
    }
    return icons[type] || <CheckCircle className="w-4 h-4 text-gray-400" />
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'border-green-500/30 bg-green-500/10',
      medium: 'border-yellow-500/30 bg-yellow-500/10',
      high: 'border-orange-500/30 bg-orange-500/10',
      critical: 'border-red-500/30 bg-red-500/10'
    }
    return colors[severity] || 'border-gray-500/30 bg-gray-500/10'
  }

  if (!canAccessFeature('shimmer-agent')) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the Shimmer AI Agent</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-400" />
              Shimmer AI Agent
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              )}>
                {isActive ? 'Active' : 'Inactive'}
              </div>
            </h1>
            <p className="text-gray-400 mt-1">
              Advanced AI agent with system integration and automation capabilities
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTaskModal(true)}
              disabled={!isActive}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              New Task
            </button>
            
            <button
              onClick={generateInsights}
              disabled={!isActive || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Brain className="w-4 h-4" />
              Analyze
            </button>
            
            <button
              onClick={isActive ? deactivateAgent : activateAgent}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {isActive && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{activeTasks.length}</div>
                <div className="text-xs text-gray-400">Active Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{metrics.tasksCompleted}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{insights.filter(i => !i.dismissed).length}</div>
                <div className="text-xs text-gray-400">Insights</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{recommendations.filter(r => !r.implemented).length}</div>
                <div className="text-xs text-gray-400">Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{metrics.issuesResolved}</div>
                <div className="text-xs text-gray-400">Issues Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{metrics.systemOptimizations}</div>
                <div className="text-xs text-gray-400">Optimizations</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
            { id: 'tasks', label: 'Tasks', icon: <CheckCircle className="w-4 h-4" /> },
            { id: 'insights', label: 'Insights', icon: <Brain className="w-4 h-4" /> },
            { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Capabilities */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      Capabilities
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {capabilities.map((capability) => (
                        <div
                          key={capability}
                          className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg"
                        >
                          {getTaskIcon(capability)}
                          <span className="text-sm text-gray-300 capitalize">
                            {capability.replace('-', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-400" />
                      Recent Activity
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {taskHistory.slice(0, 10).map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                          {getTaskIcon(task.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{task.title}</div>
                            <div className="text-xs text-gray-400">
                              {task.endTime?.toLocaleTimeString()} • {formatDuration(task.endTime!.getTime() - task.startTime.getTime())}
                            </div>
                          </div>
                          <div className={cn("text-xs font-medium", getStatusColor(task.status))}>
                            {task.status}
                          </div>
                        </div>
                      ))}
                      {taskHistory.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      Performance Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Tasks Completed</span>
                        <span className="text-white font-medium">{metrics.tasksCompleted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Insights Generated</span>
                        <span className="text-white font-medium">{metrics.insightsGenerated}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Recommendations Implemented</span>
                        <span className="text-white font-medium">{metrics.recommendationsImplemented}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">System Optimizations</span>
                        <span className="text-white font-medium">{metrics.systemOptimizations}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Issues Resolved</span>
                        <span className="text-white font-medium">{metrics.issuesResolved}</span>
                      </div>
                    </div>
                    <button
                      onClick={resetMetrics}
                      className="mt-4 w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      Reset Metrics
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const taskId = createTask('system-monitoring', 'System Health Check', 'Analyze current system performance and health')
                          executeTask(taskId)
                        }}
                        disabled={!isActive}
                        className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <Monitor className="w-4 h-4" />
                        Health Check
                      </button>
                      <button
                        onClick={() => {
                          const taskId = createTask('log-analysis', 'Analyze Recent Logs', 'Analyze recent logs for issues and patterns')
                          executeTask(taskId)
                        }}
                        disabled={!isActive}
                        className="flex items-center gap-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Log Analysis
                      </button>
                      <button
                        onClick={() => {
                          const taskId = createTask('performance-optimization', 'Optimize Performance', 'Optimize system performance and resource usage')
                          executeTask(taskId)
                        }}
                        disabled={!isActive}
                        className="flex items-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Optimize
                      </button>
                      <button
                        onClick={generateRecommendations}
                        disabled={!isActive}
                        className="flex items-center gap-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Recommendations
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto"
              >
                <div className="space-y-4">
                  {/* Active Tasks */}
                  {tasks.filter(t => t.status === 'running' || t.status === 'pending').length > 0 && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Active Tasks</h3>
                      <div className="space-y-2">
                        {tasks.filter(t => t.status === 'running' || t.status === 'pending').map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                            {getTaskIcon(task.type)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white">{task.title}</div>
                              <div className="text-xs text-gray-400">{task.description}</div>
                              {task.status === 'running' && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{task.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-600 rounded-full h-1">
                                    <div 
                                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className={cn("text-xs font-medium", getStatusColor(task.status))}>
                              {task.status}
                            </div>
                            {task.status === 'running' && (
                              <button
                                onClick={() => cancelTask(task.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Task History */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Task History</h3>
                      <button
                        onClick={clearTaskHistory}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {taskHistory.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                          {getTaskIcon(task.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">{task.title}</div>
                            <div className="text-xs text-gray-400">
                              {task.startTime.toLocaleString()} • 
                              {task.endTime && ` ${formatDuration(task.endTime.getTime() - task.startTime.getTime())}`}
                            </div>
                          </div>
                          <div className={cn("text-xs font-medium", getStatusColor(task.status))}>
                            {task.status}
                          </div>
                        </div>
                      ))}
                      {taskHistory.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          No completed tasks
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto"
              >
                <div className="space-y-4">
                  {insights.filter(i => !i.dismissed).map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        getSeverityColor(insight.severity)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {insight.timestamp.toLocaleTimeString()}
                              </span>
                              <button
                                onClick={() => dismissInsight(insight.id)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{insight.description}</p>
                          {insight.actionable && insight.actions && (
                            <div className="flex flex-wrap gap-2">
                              {insight.actions.map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => executeInsightAction(insight.id, action.id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {insights.filter(i => !i.dismissed).length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                      <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Active Insights</h3>
                      <p className="text-sm">Run analysis to generate insights about your system</p>
                      <button
                        onClick={generateInsights}
                        disabled={!isActive}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Generate Insights
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'recommendations' && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto"
              >
                <div className="space-y-4">
                  {recommendations.filter(r => !r.implemented).map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">{recommendation.title}</h4>
                          <p className="text-sm text-gray-300">{recommendation.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={cn(
                            "px-2 py-1 rounded",
                            recommendation.impact === 'high' ? 'bg-green-500/20 text-green-400' :
                            recommendation.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          )}>
                            {recommendation.impact} impact
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded",
                            recommendation.effort === 'low' ? 'bg-green-500/20 text-green-400' :
                            recommendation.effort === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          )}>
                            {recommendation.effort} effort
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-400 mb-2">Implementation Steps:</h5>
                        <ol className="text-xs text-gray-300 space-y-1">
                          {recommendation.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-400 font-medium">{index + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      
                      <button
                        onClick={() => implementRecommendation(recommendation.id)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Implement Recommendation
                      </button>
                    </div>
                  ))}
                  {recommendations.filter(r => !r.implemented).length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                      <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Recommendations</h3>
                      <p className="text-sm">Generate recommendations to improve your system</p>
                      <button
                        onClick={generateRecommendations}
                        disabled={!isActive}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Generate Recommendations
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto"
              >
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Agent Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Analysis Interval (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.analysisInterval}
                          onChange={(e) => updateSettings({ analysisInterval: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Concurrent Tasks
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.maxConcurrentTasks}
                          onChange={(e) => updateSettings({ maxConcurrentTasks: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notification Level
                      </label>
                      <select
                        value={settings.notificationLevel}
                        onChange={(e) => updateSettings({ notificationLevel: e.target.value as any })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="all">All Notifications</option>
                        <option value="important">Important Only</option>
                        <option value="critical">Critical Only</option>
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.autoMonitoring}
                          onChange={(e) => updateSettings({ autoMonitoring: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">Enable automatic system monitoring</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.proactiveInsights}
                          onChange={(e) => updateSettings({ proactiveInsights: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">Generate proactive insights</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.autoOptimization}
                          onChange={(e) => updateSettings({ autoOptimization: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">Enable automatic optimization</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Task Creation Modal */}
        <AnimatePresence>
          {showTaskModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowTaskModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Create New Task</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Task Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Select task type...</option>
                      {capabilities.map((capability) => (
                        <option key={capability} value={capability}>
                          {capability.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Enter task description..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateTask}
                    disabled={!newTaskTitle.trim() || !newTaskType}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create & Execute
                  </button>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

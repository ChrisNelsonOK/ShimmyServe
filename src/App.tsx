import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { ServerManagement } from './pages/ServerManagement'
import { Chat } from './pages/Chat'
import { KnowledgeBase } from './pages/KnowledgeBase'
import { Terminal } from './pages/Terminal'
import { Logs } from './pages/Logs'
import { Settings } from './pages/Settings'
import { useAuth } from './hooks/useAuth'
import './App.css'

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/server" element={<ServerManagement />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
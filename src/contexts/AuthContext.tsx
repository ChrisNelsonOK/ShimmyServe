import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService, type AuthResult, type User } from '../lib/auth/browser'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<AuthResult>
  register: (username: string, email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const result = await AuthService.validateSession(token)
          if (result.success && result.user) {
            setUser(result.user)
          } else {
            localStorage.removeItem('auth_token')
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)
      const result = await AuthService.login({ username, password })
      
      if (result.success && result.user && result.token) {
        setUser(result.user)
        localStorage.setItem('auth_token', result.token)
      }
      
      return result
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)
      const result = await AuthService.register({ username, email, password })
      
      if (result.success && result.user && result.token) {
        setUser(result.user)
        localStorage.setItem('auth_token', result.token)
      }
      
      return result
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await AuthService.logout(token)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('auth_token')
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const result = await AuthService.updatePassword(user.id, currentPassword, newPassword)
      return result
    } catch (error) {
      console.error('Password update failed:', error)
      return { success: false, error: 'Password update failed' }
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'user' | 'viewer'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  isActive: boolean
  lastLogin?: Date
  preferences: {
    theme: 'dark' | 'light' | 'auto'
    language: string
    notifications: boolean
  }
}

export interface AuthState {
  // User data
  currentUser: User | null
  users: User[]
  isAuthenticated: boolean
  
  // Session management
  sessionToken: string | null
  sessionExpiry: Date | null
  
  // UI state
  isLoading: boolean
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshSession: () => Promise<boolean>
  
  // User management
  createUser: (userData: Omit<User, 'id' | 'lastLogin'>) => Promise<{ success: boolean; error?: string }>
  updateUser: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>
  loadAllUsers: () => Promise<void>
  
  // Permissions
  hasPermission: (permission: string) => boolean
  canAccessFeature: (feature: string) => boolean
}

// Permission mappings
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'user-management',
    'system-settings',
    'system-logs',
    'knowledge-base',
    'terminal-access',
    'server-management',
    'api-keys',
    'security-settings'
  ],
  user: [
    'system-logs',
    'knowledge-base',
    'server-management'
  ],
  viewer: [
    'system-logs'
  ]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: [],
      isAuthenticated: false,
      sessionToken: null,
      sessionExpiry: null,
      isLoading: false,

      // Login
      login: async (username, password) => {
        try {
          set({ isLoading: true })
          
          // Mock authentication - in production, this would call an API
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          if (username === 'admin' && password === 'admin') {
            const user: User = {
              id: '1',
              username: 'admin',
              email: 'admin@shimmy.local',
              role: 'admin',
              isActive: true,
              lastLogin: new Date(),
              preferences: {
                theme: 'dark',
                language: 'en',
                notifications: true
              }
            }
            
            const sessionToken = crypto.randomUUID()
            const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            
            set({
              currentUser: user,
              isAuthenticated: true,
              sessionToken,
              sessionExpiry,
              isLoading: false
            })
            
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: 'Invalid credentials' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Login failed' }
        }
      },

      // Logout
      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          sessionToken: null,
          sessionExpiry: null
        })
      },

      // Refresh session
      refreshSession: async () => {
        try {
          const { sessionToken, sessionExpiry } = get()
          
          if (!sessionToken || !sessionExpiry) {
            return false
          }
          
          if (new Date() > sessionExpiry) {
            get().logout()
            return false
          }
          
          // Extend session
          const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
          set({ sessionExpiry: newExpiry })
          
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      // Create user
      createUser: async (userData) => {
        try {
          const newUser: User = {
            ...userData,
            id: crypto.randomUUID()
          }
          
          const { users } = get()
          set({ users: [...users, newUser] })
          
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Failed to create user' }
        }
      },

      // Update user
      updateUser: async (userId, updates) => {
        try {
          const { users } = get()
          const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, ...updates } : user
          )
          
          set({ users: updatedUsers })
          
          // Update current user if it's the same user
          const { currentUser } = get()
          if (currentUser?.id === userId) {
            set({ currentUser: { ...currentUser, ...updates } })
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Failed to update user' }
        }
      },

      // Delete user
      deleteUser: async (userId) => {
        try {
          const { users } = get()
          const updatedUsers = users.filter(user => user.id !== userId)
          
          set({ users: updatedUsers })
          
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Failed to delete user' }
        }
      },

      // Load all users
      loadAllUsers: async () => {
        try {
          // Mock users for demonstration
          const mockUsers: User[] = [
            {
              id: '1',
              username: 'admin',
              email: 'admin@shimmy.local',
              role: 'admin',
              isActive: true,
              lastLogin: new Date(),
              preferences: {
                theme: 'dark',
                language: 'en',
                notifications: true
              }
            },
            {
              id: '2',
              username: 'user1',
              email: 'user1@shimmy.local',
              role: 'user',
              isActive: true,
              lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
              preferences: {
                theme: 'dark',
                language: 'en',
                notifications: false
              }
            }
          ]
          
          set({ users: mockUsers })
        } catch (error) {
          console.error('Failed to load users:', error)
        }
      },

      // Check permission
      hasPermission: (permission) => {
        const { currentUser } = get()
        if (!currentUser) return false
        
        const userPermissions = ROLE_PERMISSIONS[currentUser.role] || []
        return userPermissions.includes(permission)
      },

      // Check feature access
      canAccessFeature: (feature) => {
        return get().hasPermission(feature)
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        sessionToken: state.sessionToken,
        sessionExpiry: state.sessionExpiry
      })
    }
  )
)

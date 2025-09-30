import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      users: [],
      permissions: {},
      sessionExpiry: null,
      lastActivity: new Date()
    })
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const store = useAuthStore.getState()
      
      const result = await store.login('admin', 'admin')
      
      expect(result.success).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user?.username).toBe('admin')
      expect(useAuthStore.getState().user?.role).toBe('admin')
    })

    it('should fail login with invalid credentials', async () => {
      const store = useAuthStore.getState()
      
      const result = await store.login('invalid', 'credentials')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid username or password')
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should logout successfully', () => {
      // First login
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true
      })

      const store = useAuthStore.getState()
      store.logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should refresh session when valid', async () => {
      // Set up authenticated state with valid session
      const futureExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true,
        sessionExpiry: futureExpiry
      })

      const store = useAuthStore.getState()
      const result = await store.refreshSession()

      expect(result).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should fail to refresh expired session', async () => {
      // Set up authenticated state with expired session
      const pastExpiry = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true,
        sessionExpiry: pastExpiry
      })

      const store = useAuthStore.getState()
      const result = await store.refreshSession()

      expect(result).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('User Management', () => {
    beforeEach(() => {
      // Set up admin user
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true
      })
    })

    it('should create a new user', async () => {
      const store = useAuthStore.getState()
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user' as const
      }

      const result = await store.createUser(userData)

      expect(result.success).toBe(true)
      expect(result.user?.username).toBe('testuser')
      expect(result.user?.role).toBe('user')
      expect(useAuthStore.getState().users).toHaveLength(1)
    })

    it('should fail to create user with duplicate username', async () => {
      const store = useAuthStore.getState()
      
      // Create first user
      await store.createUser({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
        role: 'user'
      })

      // Try to create second user with same username
      const result = await store.createUser({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password456',
        role: 'user'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username already exists')
      expect(useAuthStore.getState().users).toHaveLength(1)
    })

    it('should update user successfully', async () => {
      const store = useAuthStore.getState()
      
      // Create user first
      const createResult = await store.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      })

      const userId = createResult.user!.id

      // Update user
      const updateResult = await store.updateUser(userId, {
        email: 'updated@example.com',
        role: 'admin'
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.user?.email).toBe('updated@example.com')
      expect(updateResult.user?.role).toBe('admin')
    })

    it('should delete user successfully', async () => {
      const store = useAuthStore.getState()
      
      // Create user first
      const createResult = await store.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      })

      const userId = createResult.user!.id

      // Delete user
      const deleteResult = await store.deleteUser(userId)

      expect(deleteResult.success).toBe(true)
      expect(useAuthStore.getState().users).toHaveLength(0)
    })
  })

  describe('Permissions', () => {
    it('should check admin permissions correctly', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true
      })

      const store = useAuthStore.getState()

      expect(store.hasPermission('user-management')).toBe(true)
      expect(store.hasPermission('system-settings')).toBe(true)
      expect(store.hasPermission('server-control')).toBe(true)
      expect(store.canAccessFeature('settings-panel')).toBe(true)
    })

    it('should check user permissions correctly', () => {
      useAuthStore.setState({
        user: {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true
      })

      const store = useAuthStore.getState()

      expect(store.hasPermission('user-management')).toBe(false)
      expect(store.hasPermission('system-settings')).toBe(false)
      expect(store.hasPermission('chat-interface')).toBe(true)
      expect(store.canAccessFeature('knowledge-base')).toBe(true)
    })

    it('should check viewer permissions correctly', () => {
      useAuthStore.setState({
        user: {
          id: '3',
          username: 'viewer',
          email: 'viewer@example.com',
          role: 'viewer',
          isActive: true,
          lastLogin: new Date(),
          preferences: {}
        },
        isAuthenticated: true
      })

      const store = useAuthStore.getState()

      expect(store.hasPermission('server-control')).toBe(false)
      expect(store.hasPermission('chat-interface')).toBe(false)
      expect(store.hasPermission('view-logs')).toBe(true)
      expect(store.canAccessFeature('dashboard')).toBe(true)
    })

    it('should deny all permissions when not authenticated', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false
      })

      const store = useAuthStore.getState()

      expect(store.hasPermission('view-logs')).toBe(false)
      expect(store.hasPermission('chat-interface')).toBe(false)
      expect(store.canAccessFeature('dashboard')).toBe(false)
    })
  })

  describe('Session Management', () => {
    it('should update last activity', () => {
      const initialTime = new Date('2023-12-01T10:00:00Z')
      useAuthStore.setState({ lastActivity: initialTime })

      const store = useAuthStore.getState()
      store.updateLastActivity()

      const newActivity = useAuthStore.getState().lastActivity
      expect(newActivity.getTime()).toBeGreaterThan(initialTime.getTime())
    })

    it('should check if session is expired', () => {
      const store = useAuthStore.getState()

      // Test with future expiry
      useAuthStore.setState({
        sessionExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      })
      expect(store.isSessionExpired()).toBe(false)

      // Test with past expiry
      useAuthStore.setState({
        sessionExpiry: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      })
      expect(store.isSessionExpired()).toBe(true)

      // Test with no expiry
      useAuthStore.setState({ sessionExpiry: null })
      expect(store.isSessionExpired()).toBe(false)
    })
  })
})

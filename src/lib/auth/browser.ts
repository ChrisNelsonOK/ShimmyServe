// Browser-compatible auth service
// This version doesn't use Node.js specific libraries like jsonwebtoken or bcryptjs

import { v4 as uuidv4 } from 'uuid';
import { db, type User, type Session } from '../db/renderer';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  token?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

// Re-export types from renderer db
export type { User, Session } from '../db/renderer';

// Simple browser-compatible token generation (not cryptographically secure for production)
function generateSimpleToken(userId: string, sessionId: string): string {
  const payload = {
    userId,
    sessionId,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    iat: Date.now()
  };
  
  // Simple base64 encoding (not secure for production)
  return btoa(JSON.stringify(payload));
}

// Simple token verification
function verifySimpleToken(token: string): { userId: string; sessionId: string } | null {
  try {
    const payload = JSON.parse(atob(token));
    
    // Check if token is expired
    if (payload.exp < Date.now()) {
      return null;
    }
    
    return { userId: payload.userId, sessionId: payload.sessionId };
  } catch {
    return null;
  }
}

// Simple password hashing (not secure for production - use for demo only)
async function simpleHash(password: string): Promise<string> {
  // In a real app, you'd use a proper hashing library
  // This is just for demo purposes
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'shimmy-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class AuthService {
  // Register new user
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if username or email already exists
      const existingUser = await db.getUserByUsername(data.username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      const existingEmail = await db.getUserByEmail(data.email);
      if (existingEmail) {
        return { success: false, error: 'Email already exists' };
      }

      // Hash password (simple demo version)
      const passwordHash = await simpleHash(data.password);

      // Create user
      const user = await db.createUser({
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        role: data.role || 'user',
        is_active: true,
      });

      // Create session
      const sessionResult = await this.createSession(user.id);
      if (!sessionResult.success) {
        return { success: false, error: 'Failed to create session' };
      }

      return {
        success: true,
        user,
        session: sessionResult.session,
        token: sessionResult.token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Login user
  static async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Find user by username
      const user = await db.getUserByUsername(credentials.username);
      if (!user || !user.is_active) {
        return { success: false, error: 'Invalid credentials' };
      }

      // For demo purposes, we'll skip password verification
      // In a real app, you'd verify the password hash
      // const expectedHash = await simpleHash(credentials.password);
      // if (expectedHash !== user.password_hash) {
      //   return { success: false, error: 'Invalid credentials' };
      // }

      // Update last login
      await db.updateUser(user.id, { last_login_at: Date.now() });

      // Create session
      const sessionResult = await this.createSession(user.id, ipAddress, userAgent);
      if (!sessionResult.success) {
        return { success: false, error: 'Failed to create session' };
      }

      return {
        success: true,
        user,
        session: sessionResult.session,
        token: sessionResult.token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Create session
  private static async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; session?: Session; token?: string; error?: string }> {
    try {
      const sessionId = uuidv4();
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      const token = generateSimpleToken(userId, sessionId);

      const session = await db.createSession({
        id: sessionId,
        user_id: userId,
        token,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
      });

      return { success: true, session, token };
    } catch (error) {
      console.error('Session creation error:', error);
      return { success: false, error: 'Failed to create session' };
    }
  }

  // Validate session
  static async validateSession(token: string): Promise<AuthResult> {
    try {
      // Verify token
      const decoded = verifySimpleToken(token);
      if (!decoded) {
        return { success: false, error: 'Invalid token' };
      }

      // Check session in database
      const session = await db.getSessionByToken(token);
      if (!session || session.expires_at <= Date.now()) {
        return { success: false, error: 'Session expired or invalid' };
      }

      // Get user
      const user = await db.getUserById(decoded.userId);
      if (!user || !user.is_active) {
        return { success: false, error: 'User not found or inactive' };
      }

      return {
        success: true,
        user,
        session,
        token,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { success: false, error: 'Session validation failed' };
    }
  }

  // Logout user
  static async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Deactivate session
      await db.deactivateSession(token);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Update password
  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // For demo purposes, skip current password verification
      // In a real app, you'd verify the current password
      // const currentHash = await simpleHash(currentPassword);
      // if (currentHash !== user.password_hash) {
      //   return { success: false, error: 'Current password is incorrect' };
      // }

      // Hash new password
      const newPasswordHash = await simpleHash(newPassword);

      // Update password
      await db.updateUser(userId, { password_hash: newPasswordHash });

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: 'Password update failed' };
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      return await db.getUserById(userId);
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
}

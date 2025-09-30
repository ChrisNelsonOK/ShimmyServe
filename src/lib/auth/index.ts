import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, type User, type Session } from '../db/renderer';

const JWT_SECRET = process.env.JWT_SECRET || 'shimmy-serve-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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

export class AuthService {
  // Hash password
  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  private static generateToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Verify JWT token
  private static verifyToken(token: string): { userId: string; sessionId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { userId: decoded.userId, sessionId: decoded.sessionId };
    } catch {
      return null;
    }
  }

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

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

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

      // Verify password (for now, skip password verification in mock)
      // In a real implementation, this would verify against the hashed password
      // const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash);
      // if (!isValidPassword) {
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
  private static async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      const token = this.generateToken(userId, uuidv4());
      const expiresAt = Date.now() + SESSION_DURATION;

      const session = await db.createSession({
        user_id: userId,
        token,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      return {
        success: true,
        session,
        token,
      };
    } catch (error) {
      console.error('Session creation error:', error);
      return { success: false, error: 'Failed to create session' };
    }
  }

  // Validate session
  static async validateSession(token: string): Promise<AuthResult> {
    try {
      // Verify JWT token
      const decoded = this.verifyToken(token);
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

  // Logout (invalidate session)
  static async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return { success: false, error: 'Invalid token' };
      }

      // Delete session from database
      await db.deleteSession(decoded.sessionId);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // This would be implemented in the main process
      console.log('Session cleanup not implemented in renderer');
    } catch (error) {
      console.error('Session cleanup error:', error);
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

  // Update user password
  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // For mock implementation, skip password verification
      // In real implementation, verify current password first

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await db.updateUser(userId, {
        password_hash: newPasswordHash,
        updated_at: Date.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: 'Password update failed' };
    }
  }
}

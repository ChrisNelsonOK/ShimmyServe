import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { terminalSessions, logs, type TerminalSession, type NewTerminalSession } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import os from 'os';
import path from 'path';

export interface TerminalOptions {
  userId: string;
  cwd?: string;
  shell?: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
}

export interface TerminalData {
  sessionId: string;
  data: string;
  timestamp: Date;
}

export class TerminalService extends EventEmitter {
  private terminals: Map<string, pty.IPty> = new Map();
  private sessions: Map<string, TerminalSession> = new Map();

  constructor() {
    super();
  }

  // Create new terminal session
  async createTerminal(options: TerminalOptions): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const sessionId = uuidv4();
      
      // Determine shell
      const shell = options.shell || this.getDefaultShell();
      
      // Determine working directory
      const cwd = options.cwd || os.homedir();
      
      // Create terminal session record
      const sessionData: NewTerminalSession = {
        id: sessionId,
        userId: options.userId,
        cwd,
        shell,
        isActive: true,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      await db.insert(terminalSessions).values(sessionData);

      // Create PTY process
      const terminal = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: options.cols || 80,
        rows: options.rows || 24,
        cwd,
        env: {
          ...process.env,
          ...options.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      });

      // Store references
      this.terminals.set(sessionId, terminal);
      
      const session = await db
        .select()
        .from(terminalSessions)
        .where(eq(terminalSessions.id, sessionId))
        .limit(1);

      if (session.length > 0) {
        const sessionRecord = { ...session[0], pid: terminal.pid };
        this.sessions.set(sessionId, sessionRecord);
        
        // Update PID in database
        await db
          .update(terminalSessions)
          .set({ pid: terminal.pid })
          .where(eq(terminalSessions.id, sessionId));
      }

      // Handle terminal events
      terminal.onData((data) => {
        this.emit('data', { sessionId, data, timestamp: new Date() });
        this.updateLastActivity(sessionId);
      });

      terminal.onExit(({ exitCode, signal }) => {
        this.handleTerminalExit(sessionId, exitCode, signal);
      });

      await this.logInfo(`Terminal session created: ${sessionId}`, { userId: options.userId, shell, cwd });

      return { success: true, sessionId };
    } catch (error) {
      await this.logError('Failed to create terminal', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Write data to terminal
  async writeToTerminal(sessionId: string, data: string): Promise<{ success: boolean; error?: string }> {
    try {
      const terminal = this.terminals.get(sessionId);
      if (!terminal) {
        return { success: false, error: 'Terminal session not found' };
      }

      terminal.write(data);
      await this.updateLastActivity(sessionId);

      return { success: true };
    } catch (error) {
      await this.logError('Failed to write to terminal', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Resize terminal
  async resizeTerminal(sessionId: string, cols: number, rows: number): Promise<{ success: boolean; error?: string }> {
    try {
      const terminal = this.terminals.get(sessionId);
      if (!terminal) {
        return { success: false, error: 'Terminal session not found' };
      }

      terminal.resize(cols, rows);
      await this.updateLastActivity(sessionId);

      return { success: true };
    } catch (error) {
      await this.logError('Failed to resize terminal', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Kill terminal session
  async killTerminal(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const terminal = this.terminals.get(sessionId);
      if (!terminal) {
        return { success: false, error: 'Terminal session not found' };
      }

      terminal.kill();
      await this.cleanupTerminal(sessionId);

      return { success: true };
    } catch (error) {
      await this.logError('Failed to kill terminal', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get terminal session info
  async getTerminalSession(sessionId: string): Promise<TerminalSession | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        return session;
      }

      const dbSession = await db
        .select()
        .from(terminalSessions)
        .where(eq(terminalSessions.id, sessionId))
        .limit(1);

      return dbSession.length > 0 ? dbSession[0] : null;
    } catch (error) {
      await this.logError('Failed to get terminal session', error);
      return null;
    }
  }

  // Get user's terminal sessions
  async getUserTerminalSessions(userId: string): Promise<TerminalSession[]> {
    try {
      const sessions = await db
        .select()
        .from(terminalSessions)
        .where(
          and(
            eq(terminalSessions.userId, userId),
            eq(terminalSessions.isActive, true)
          )
        );

      return sessions;
    } catch (error) {
      await this.logError('Failed to get user terminal sessions', error);
      return [];
    }
  }

  // Execute command in terminal
  async executeCommand(sessionId: string, command: string): Promise<{ success: boolean; error?: string }> {
    try {
      const terminal = this.terminals.get(sessionId);
      if (!terminal) {
        return { success: false, error: 'Terminal session not found' };
      }

      // Write command followed by enter
      terminal.write(command + '\r');
      await this.updateLastActivity(sessionId);

      await this.logInfo(`Command executed in terminal ${sessionId}`, { command });

      return { success: true };
    } catch (error) {
      await this.logError('Failed to execute command', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get terminal history (if implemented)
  async getTerminalHistory(sessionId: string, limit = 100): Promise<string[]> {
    // This would require implementing terminal history storage
    // For now, return empty array
    return [];
  }

  // Clear terminal
  async clearTerminal(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const terminal = this.terminals.get(sessionId);
      if (!terminal) {
        return { success: false, error: 'Terminal session not found' };
      }

      // Send clear command
      terminal.write('\x1b[2J\x1b[H');
      await this.updateLastActivity(sessionId);

      return { success: true };
    } catch (error) {
      await this.logError('Failed to clear terminal', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Private helper methods
  private getDefaultShell(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  private async handleTerminalExit(sessionId: string, exitCode: number, signal: number) {
    try {
      await this.logInfo(`Terminal session exited: ${sessionId}`, { exitCode, signal });
      await this.cleanupTerminal(sessionId);
      this.emit('exit', { sessionId, exitCode, signal });
    } catch (error) {
      await this.logError('Failed to handle terminal exit', error);
    }
  }

  private async cleanupTerminal(sessionId: string) {
    try {
      // Remove from memory
      this.terminals.delete(sessionId);
      this.sessions.delete(sessionId);

      // Mark as inactive in database
      await db
        .update(terminalSessions)
        .set({ isActive: false })
        .where(eq(terminalSessions.id, sessionId));
    } catch (error) {
      await this.logError('Failed to cleanup terminal', error);
    }
  }

  private async updateLastActivity(sessionId: string) {
    try {
      await db
        .update(terminalSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(terminalSessions.id, sessionId));

      // Update in-memory session
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivityAt = new Date();
      }
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  private async logInfo(message: string, metadata?: any) {
    await db.insert(logs).values({
      id: uuidv4(),
      level: 'info',
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      source: 'terminal',
      createdAt: new Date(),
    });
  }

  private async logError(message: string, error: any) {
    await db.insert(logs).values({
      id: uuidv4(),
      level: 'error',
      message,
      metadata: JSON.stringify({
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      }),
      source: 'terminal',
      createdAt: new Date(),
    });
  }

  // Cleanup all terminals on shutdown
  async cleanup() {
    for (const [sessionId, terminal] of this.terminals) {
      try {
        terminal.kill();
        await this.cleanupTerminal(sessionId);
      } catch (error) {
        console.error(`Failed to cleanup terminal ${sessionId}:`, error);
      }
    }
  }
}

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { db } from '../db/index.js';
import { terminalSessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface SimpleTerminalSession {
  id: string;
  process: ChildProcess;
  createdAt: Date;
  output: string[];
}

export class SimpleTerminalService extends EventEmitter {
  private sessions: Map<string, SimpleTerminalSession> = new Map();

  constructor() {
    super();
  }

  createSession(sessionId: string, shell?: string, cwd?: string): SimpleTerminalSession {
    const defaultShell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const childProcess = spawn(shell || defaultShell, [], {
      cwd: cwd || process.env.HOME || process.env.USERPROFILE || '/',
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const session: SimpleTerminalSession = {
      id: sessionId,
      process: childProcess,
      createdAt: new Date(),
      output: [],
    };

    this.sessions.set(sessionId, session);

    // Handle stdout data
    childProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      session.output.push(output);
      this.emit('data', sessionId, output);
    });

    // Handle stderr data
    childProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      session.output.push(output);
      this.emit('data', sessionId, output);
    });

    // Handle process exit
    childProcess.on('exit', (exitCode, signal) => {
      this.emit('exit', sessionId, exitCode, signal);
      this.sessions.delete(sessionId);
      
      // Save session to database
      this.saveSessionToDb(sessionId, exitCode || 0);
    });

    // Save session creation to database
    this.saveSessionToDb(sessionId);

    return session;
  }

  writeToSession(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.process.stdin) {
      session.process.stdin.write(data);
      return true;
    }
    return false;
  }

  executeCommand(sessionId: string, command: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.process.stdin) {
      session.process.stdin.write(command + '\n');
      return true;
    }
    return false;
  }

  killSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.process.kill();
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  getSession(sessionId: string): SimpleTerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): SimpleTerminalSession[] {
    return Array.from(this.sessions.values());
  }

  getSessionOutput(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? session.output : [];
  }

  private async saveSessionToDb(sessionId: string, exitCode?: number) {
    try {
      if (exitCode !== undefined) {
        // Update session with exit code
        await db.update(terminalSessions)
          .set({
            exitCode,
            endedAt: new Date(),
          })
          .where(eq(terminalSessions.sessionId, sessionId));
      } else {
        // Create new session record
        await db.insert(terminalSessions).values({
          sessionId,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to save terminal session to database:', error);
    }
  }
}

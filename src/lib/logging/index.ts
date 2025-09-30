import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { EventEmitter } from 'events';
import { db } from '../db';
import { logs, type Log, type NewLog } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogSource = 'app' | 'server' | 'system' | 'terminal' | 'auth' | 'db';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  source: LogSource;
  userId?: string;
  timestamp: Date;
}

export interface LogFilter {
  level?: LogLevel[];
  source?: LogSource[];
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export class LoggingService extends EventEmitter {
  private logger: winston.Logger;
  private logDir: string;

  constructor() {
    super();
    this.setupLogDirectory();
    this.setupWinstonLogger();
  }

  private setupLogDirectory() {
    try {
      this.logDir = path.join(app.getPath('userData'), 'logs');
    } catch {
      // Fallback for non-Electron environments
      this.logDir = path.join(process.cwd(), 'logs');
    }

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private setupWinstonLogger() {
    // Custom format for log files
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Custom format for console
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, source, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}] [${source || 'APP'}] ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        return log;
      })
    );

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: fileFormat,
      transports: [
        // Error log file
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        }),
        // Combined log file
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
        }),
        // Console output
        new winston.transports.Console({
          format: consoleFormat,
          level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        }),
      ],
    });

    // Handle uncaught exceptions and rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.join(this.logDir, 'exceptions.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 3,
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.join(this.logDir, 'rejections.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 3,
      })
    );
  }

  // Log methods
  async error(message: string, metadata?: any, source: LogSource = 'app', userId?: string): Promise<void> {
    await this.log('error', message, metadata, source, userId);
  }

  async warn(message: string, metadata?: any, source: LogSource = 'app', userId?: string): Promise<void> {
    await this.log('warn', message, metadata, source, userId);
  }

  async info(message: string, metadata?: any, source: LogSource = 'app', userId?: string): Promise<void> {
    await this.log('info', message, metadata, source, userId);
  }

  async debug(message: string, metadata?: any, source: LogSource = 'app', userId?: string): Promise<void> {
    await this.log('debug', message, metadata, source, userId);
  }

  // Main logging method
  private async log(level: LogLevel, message: string, metadata?: any, source: LogSource = 'app', userId?: string): Promise<void> {
    try {
      const logEntry: LogEntry = {
        id: uuidv4(),
        level,
        message,
        metadata,
        source,
        userId,
        timestamp: new Date(),
      };

      // Log to Winston (files and console)
      this.logger.log(level, message, { source, userId, ...metadata });

      // Store in database
      await this.storeLogInDatabase(logEntry);

      // Emit event for real-time log streaming
      this.emit('log', logEntry);

    } catch (error) {
      // Fallback to console if logging fails
      console.error('Logging failed:', error);
      console.log(`[${level.toUpperCase()}] [${source}] ${message}`, metadata);
    }
  }

  private async storeLogInDatabase(logEntry: LogEntry): Promise<void> {
    try {
      const newLog: NewLog = {
        id: logEntry.id,
        level: logEntry.level,
        message: logEntry.message,
        metadata: logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
        source: logEntry.source,
        userId: logEntry.userId || null,
        createdAt: logEntry.timestamp,
      };

      await db.insert(logs).values(newLog);
    } catch (error) {
      // Don't throw here to avoid infinite logging loops
      console.error('Failed to store log in database:', error);
    }
  }

  // Query logs from database
  async getLogs(filter: LogFilter = {}): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      let query = db.select().from(logs);
      let countQuery = db.select({ count: logs.id }).from(logs);

      // Apply filters
      const conditions = [];

      if (filter.level && filter.level.length > 0) {
        conditions.push(eq(logs.level, filter.level[0])); // Simplified for single level
      }

      if (filter.source && filter.source.length > 0) {
        conditions.push(eq(logs.source, filter.source[0])); // Simplified for single source
      }

      if (filter.userId) {
        conditions.push(eq(logs.userId, filter.userId));
      }

      if (filter.startDate) {
        conditions.push(gte(logs.createdAt, filter.startDate));
      }

      if (filter.endDate) {
        conditions.push(lte(logs.createdAt, filter.endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
        countQuery = countQuery.where(and(...conditions));
      }

      // Apply ordering, limit, and offset
      query = query.orderBy(desc(logs.createdAt));

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.offset(filter.offset);
      }

      const [logsResult, countResult] = await Promise.all([
        query,
        countQuery
      ]);

      const logEntries: LogEntry[] = logsResult.map(log => ({
        id: log.id,
        level: log.level as LogLevel,
        message: log.message,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
        source: log.source as LogSource,
        userId: log.userId || undefined,
        timestamp: log.createdAt,
      }));

      return {
        logs: logEntries,
        total: countResult.length,
      };

    } catch (error) {
      console.error('Failed to get logs:', error);
      return { logs: [], total: 0 };
    }
  }

  // Search logs
  async searchLogs(searchTerm: string, filter: LogFilter = {}): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      // This is a simplified search - in production, you might want to use FTS
      const allLogs = await this.getLogs(filter);
      
      const filteredLogs = allLogs.logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return {
        logs: filteredLogs,
        total: filteredLogs.length,
      };
    } catch (error) {
      console.error('Failed to search logs:', error);
      return { logs: [], total: 0 };
    }
  }

  // Get log statistics
  async getLogStats(startDate?: Date, endDate?: Date): Promise<{
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    sourceBreakdown: Record<LogSource, number>;
  }> {
    try {
      const filter: LogFilter = {};
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;

      const { logs } = await this.getLogs(filter);

      const stats = {
        totalLogs: logs.length,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        debugCount: 0,
        sourceBreakdown: {} as Record<LogSource, number>,
      };

      logs.forEach(log => {
        // Count by level
        switch (log.level) {
          case 'error': stats.errorCount++; break;
          case 'warn': stats.warnCount++; break;
          case 'info': stats.infoCount++; break;
          case 'debug': stats.debugCount++; break;
        }

        // Count by source
        stats.sourceBreakdown[log.source] = (stats.sourceBreakdown[log.source] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        totalLogs: 0,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        debugCount: 0,
        sourceBreakdown: {} as Record<LogSource, number>,
      };
    }
  }

  // Export logs
  async exportLogs(filter: LogFilter = {}, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { logs } = await this.getLogs(filter);

      if (format === 'csv') {
        const headers = ['timestamp', 'level', 'source', 'message', 'userId', 'metadata'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
          const row = [
            log.timestamp.toISOString(),
            log.level,
            log.source,
            `"${log.message.replace(/"/g, '""')}"`,
            log.userId || '',
            log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
          ];
          csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
      throw error;
    }
  }

  // Clear old logs
  async clearOldLogs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db
        .delete(logs)
        .where(lte(logs.createdAt, cutoffDate));

      await this.info(`Cleared old logs`, { deletedCount: result, cutoffDate });
      
      return result;
    } catch (error) {
      console.error('Failed to clear old logs:', error);
      throw error;
    }
  }

  // Get log file paths
  getLogFilePaths(): { error: string; combined: string; exceptions: string; rejections: string } {
    return {
      error: path.join(this.logDir, 'error.log'),
      combined: path.join(this.logDir, 'combined.log'),
      exceptions: path.join(this.logDir, 'exceptions.log'),
      rejections: path.join(this.logDir, 'rejections.log'),
    };
  }

  // Shutdown logging service
  async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }
}

// Create singleton instance
export const loggingService = new LoggingService();

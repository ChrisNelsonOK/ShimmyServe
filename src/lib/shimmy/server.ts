import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { db } from '../db';
import { serverConfigs, logs, metrics, type ServerConfig, type NewServerConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface ServerStatus {
  isRunning: boolean;
  pid?: number;
  port?: number;
  model?: string;
  uptime?: number;
  lastError?: string;
}

export interface ModelInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  loaded: boolean;
}

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  requestCount: number;
  averageResponseTime: number;
  tokensPerSecond: number;
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ShimmyServerService extends EventEmitter {
  private serverProcess: ChildProcess | null = null;
  private apiClient: AxiosInstance | null = null;
  private currentConfig: ServerConfig | null = null;
  private startTime: Date | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupApiClient();
  }

  private setupApiClient() {
    this.apiClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get server status
  async getStatus(): Promise<ServerStatus> {
    const isRunning = this.serverProcess !== null && !this.serverProcess.killed;
    
    if (!isRunning) {
      return { isRunning: false };
    }

    try {
      const response = await this.apiClient!.get(`http://${this.currentConfig?.host}:${this.currentConfig?.port}/health`);
      
      return {
        isRunning: true,
        pid: this.serverProcess?.pid,
        port: this.currentConfig?.port,
        model: this.currentConfig?.modelPath ? path.basename(this.currentConfig.modelPath) : undefined,
        uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      };
    } catch (error) {
      await this.logError('Failed to get server status', error);
      return {
        isRunning: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Start server with configuration
  async startServer(configId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.serverProcess) {
        return { success: false, error: 'Server is already running' };
      }

      // Get configuration
      let config: ServerConfig;
      if (configId) {
        const configs = await db
          .select()
          .from(serverConfigs)
          .where(eq(serverConfigs.id, configId))
          .limit(1);
        
        if (configs.length === 0) {
          return { success: false, error: 'Configuration not found' };
        }
        config = configs[0];
      } else {
        // Get active configuration or create default
        const activeConfigs = await db
          .select()
          .from(serverConfigs)
          .where(eq(serverConfigs.isActive, true))
          .limit(1);

        if (activeConfigs.length === 0) {
          config = await this.createDefaultConfig();
        } else {
          config = activeConfigs[0];
        }
      }

      this.currentConfig = config;

      // Find Shimmy executable
      const shimmyPath = await this.findShimmyExecutable();
      if (!shimmyPath) {
        return { success: false, error: 'Shimmy executable not found' };
      }

      // Prepare arguments
      const args = [
        '--host', config.host,
        '--port', config.port.toString(),
      ];

      if (config.modelPath && fs.existsSync(config.modelPath)) {
        args.push('--model', config.modelPath);
      }

      if (config.maxTokens) {
        args.push('--max-tokens', config.maxTokens.toString());
      }

      if (config.temperature) {
        args.push('--temperature', config.temperature.toString());
      }

      // Start server process
      this.serverProcess = spawn(shimmyPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.startTime = new Date();

      // Handle process events
      this.serverProcess.on('error', (error) => {
        this.logError('Server process error', error);
        this.emit('error', error);
      });

      this.serverProcess.on('exit', (code, signal) => {
        this.logInfo(`Server process exited with code ${code}, signal ${signal}`);
        this.cleanup();
        this.emit('exit', { code, signal });
      });

      this.serverProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        this.logInfo(`Server stdout: ${message}`);
        this.emit('stdout', message);
      });

      this.serverProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        this.logError('Server stderr', new Error(message));
        this.emit('stderr', message);
      });

      // Wait for server to be ready
      const isReady = await this.waitForServerReady();
      if (!isReady) {
        this.stopServer();
        return { success: false, error: 'Server failed to start within timeout' };
      }

      // Start metrics collection
      this.startMetricsCollection();

      this.emit('started', config);
      return { success: true };

    } catch (error) {
      await this.logError('Failed to start server', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Stop server
  async stopServer(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.serverProcess) {
        return { success: false, error: 'Server is not running' };
      }

      // Stop metrics collection
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Gracefully terminate the process
      this.serverProcess.kill('SIGTERM');

      // Wait for process to exit, then force kill if necessary
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);

      this.cleanup();
      this.emit('stopped');
      
      return { success: true };
    } catch (error) {
      await this.logError('Failed to stop server', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Send chat request
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.currentConfig || !this.serverProcess) {
      throw new Error('Server is not running');
    }

    try {
      const response = await this.apiClient!.post(
        `http://${this.currentConfig.host}:${this.currentConfig.port}/v1/chat/completions`,
        {
          model: request.model || 'default',
          messages: request.messages,
          temperature: request.temperature ?? this.currentConfig.temperature,
          max_tokens: request.maxTokens ?? this.currentConfig.maxTokens,
          stream: request.stream ?? false,
        }
      );

      return response.data;
    } catch (error) {
      await this.logError('Chat request failed', error);
      throw error;
    }
  }

  // Get available models
  async getModels(): Promise<ModelInfo[]> {
    // This would scan for available model files
    // For now, return empty array - implement based on your model storage structure
    return [];
  }

  // Get server metrics
  async getMetrics(): Promise<ServerMetrics> {
    // This would collect actual metrics from the server
    // For now, return mock data - implement based on your monitoring needs
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      requestCount: 0,
      averageResponseTime: 0,
      tokensPerSecond: 0,
    };
  }

  // Private helper methods
  private async findShimmyExecutable(): Promise<string | null> {
    // Look for Shimmy executable in common locations
    const possiblePaths = [
      path.join(process.cwd(), 'shimmy'),
      path.join(process.cwd(), 'shimmy.exe'),
      path.join(app.getPath('userData'), 'shimmy'),
      path.join(app.getPath('userData'), 'shimmy.exe'),
      '/usr/local/bin/shimmy',
      '/usr/bin/shimmy',
    ];

    for (const shimPath of possiblePaths) {
      if (fs.existsSync(shimPath)) {
        return shimPath;
      }
    }

    return null;
  }

  private async waitForServerReady(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await this.apiClient!.get(`http://${this.currentConfig?.host}:${this.currentConfig?.port}/health`);
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return false;
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        await this.saveMetrics(metrics);
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, 10000); // Collect metrics every 10 seconds
  }

  private async saveMetrics(serverMetrics: ServerMetrics) {
    const timestamp = new Date();
    
    const metricsToSave = [
      { type: 'cpu', value: serverMetrics.cpuUsage, unit: 'percent' },
      { type: 'memory', value: serverMetrics.memoryUsage, unit: 'bytes' },
      { type: 'requests', value: serverMetrics.requestCount, unit: 'count' },
      { type: 'response_time', value: serverMetrics.averageResponseTime, unit: 'ms' },
      { type: 'tokens_per_second', value: serverMetrics.tokensPerSecond, unit: 'tps' },
    ];

    if (serverMetrics.gpuUsage !== undefined) {
      metricsToSave.push({ type: 'gpu', value: serverMetrics.gpuUsage, unit: 'percent' });
    }

    for (const metric of metricsToSave) {
      await db.insert(metrics).values({
        id: uuidv4(),
        metricType: metric.type,
        value: metric.value,
        unit: metric.unit,
        createdAt: timestamp,
      });
    }
  }

  private async createDefaultConfig(): Promise<ServerConfig> {
    const config: NewServerConfig = {
      id: uuidv4(),
      name: 'Default Configuration',
      host: 'localhost',
      port: 8080,
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(serverConfigs).values(config);
    
    const created = await db
      .select()
      .from(serverConfigs)
      .where(eq(serverConfigs.id, config.id))
      .limit(1);

    return created[0];
  }

  private cleanup() {
    this.serverProcess = null;
    this.currentConfig = null;
    this.startTime = null;
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private async logInfo(message: string, metadata?: any) {
    await db.insert(logs).values({
      id: uuidv4(),
      level: 'info',
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      source: 'server',
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
      source: 'server',
      createdAt: new Date(),
    });
  }
}

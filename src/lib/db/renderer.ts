// Database interface for renderer process
// This module provides database operations through IPC communication with the main process

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: number;
  updated_at: number;
  last_login_at?: number;
  is_active: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
  ip_address?: string;
  user_agent?: string;
}

export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  model_path?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  system_prompt?: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tokens?: number;
  created_at: number;
}

// Database operations interface
export interface DatabaseOperations {
  // User operations
  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Session operations
  createSession(session: Omit<Session, 'id' | 'created_at'>): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | null>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

  // Server config operations
  createServerConfig(config: Omit<ServerConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ServerConfig>;
  getServerConfigs(): Promise<ServerConfig[]>;
  getActiveServerConfig(): Promise<ServerConfig | null>;
  updateServerConfig(id: string, updates: Partial<ServerConfig>): Promise<ServerConfig>;
  deleteServerConfig(id: string): Promise<void>;

  // Conversation operations
  createConversation(conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | null>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;

  // Message operations
  createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  deleteMessage(id: string): Promise<void>;
}

// Mock implementation for development (when IPC is not available)
class MockDatabase implements DatabaseOperations {
  private users: User[] = [];
  private sessions: Session[] = [];
  private serverConfigs: ServerConfig[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    this.users.push(user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updated_at: Date.now(),
    };
    return this.users[userIndex];
  }

  async deleteUser(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }

  async createSession(sessionData: Omit<Session, 'id' | 'created_at'>): Promise<Session> {
    const session: Session = {
      ...sessionData,
      id: this.generateId(),
      created_at: Date.now(),
    };
    this.sessions.push(session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    return this.sessions.find(s => s.token === token) || null;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== id);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = Date.now();
    this.sessions = this.sessions.filter(s => s.expires_at > now);
  }

  async createServerConfig(configData: Omit<ServerConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ServerConfig> {
    const config: ServerConfig = {
      ...configData,
      id: this.generateId(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    this.serverConfigs.push(config);
    return config;
  }

  async getServerConfigs(): Promise<ServerConfig[]> {
    return [...this.serverConfigs];
  }

  async getActiveServerConfig(): Promise<ServerConfig | null> {
    return this.serverConfigs.find(c => c.is_active) || null;
  }

  async updateServerConfig(id: string, updates: Partial<ServerConfig>): Promise<ServerConfig> {
    const configIndex = this.serverConfigs.findIndex(c => c.id === id);
    if (configIndex === -1) throw new Error('Server config not found');
    
    this.serverConfigs[configIndex] = {
      ...this.serverConfigs[configIndex],
      ...updates,
      updated_at: Date.now(),
    };
    return this.serverConfigs[configIndex];
  }

  async deleteServerConfig(id: string): Promise<void> {
    this.serverConfigs = this.serverConfigs.filter(c => c.id !== id);
  }

  async createConversation(conversationData: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<Conversation> {
    const conversation: Conversation = {
      ...conversationData,
      id: this.generateId(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    this.conversations.push(conversation);
    return conversation;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.conversations.filter(c => c.user_id === userId);
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    return this.conversations.find(c => c.id === id) || null;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const conversationIndex = this.conversations.findIndex(c => c.id === id);
    if (conversationIndex === -1) throw new Error('Conversation not found');
    
    this.conversations[conversationIndex] = {
      ...this.conversations[conversationIndex],
      ...updates,
      updated_at: Date.now(),
    };
    return this.conversations[conversationIndex];
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations = this.conversations.filter(c => c.id !== id);
    this.messages = this.messages.filter(m => m.conversation_id !== id);
  }

  async createMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const message: Message = {
      ...messageData,
      id: this.generateId(),
      created_at: Date.now(),
    };
    this.messages.push(message);
    return message;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return this.messages.filter(m => m.conversation_id === conversationId);
  }

  async deleteMessage(id: string): Promise<void> {
    this.messages = this.messages.filter(m => m.id !== id);
  }
}

// Create database instance
// In a real implementation, this would use IPC to communicate with the main process
// For now, we'll use the mock implementation for development
export const db: DatabaseOperations = new MockDatabase();

// Initialize with some sample data for development
export const initializeSampleData = async () => {
  try {
    // Create a sample user
    const user = await db.createUser({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: 'hashed_password', // In real app, this would be properly hashed
      role: 'admin',
      is_active: true,
    });

    // Create a sample server config
    await db.createServerConfig({
      name: 'Local LLM Server',
      host: 'localhost',
      port: 8080,
      model_path: '/path/to/model',
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      is_active: true,
    });

    // Create a sample conversation
    const conversation = await db.createConversation({
      user_id: user.id,
      title: 'Welcome Conversation',
      model: 'llama-2-7b',
      system_prompt: 'You are a helpful AI assistant.',
    });

    // Create sample messages
    await db.createMessage({
      conversation_id: conversation.id,
      role: 'user',
      content: 'Hello! How are you?',
      tokens: 5,
    });

    await db.createMessage({
      conversation_id: conversation.id,
      role: 'assistant',
      content: 'Hello! I\'m doing well, thank you for asking. How can I help you today?',
      tokens: 18,
    });

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
  }
};

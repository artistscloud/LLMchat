const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Initialize logger
const winston = require('winston');
const { format, transports } = winston;

// Create log directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logDir = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
  console.log(`Created log directory: ${logDir}`);
}

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? 
      '\n' + JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message}${metaString}`;
  })
);

// Custom format for file output
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'llm-chat-arena' },
  transports: [
    // Console transport with colorized output
    new transports.Console({
      format: consoleFormat
    }),
    // Error log file
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Add shutdown handler
process.on('SIGINT', () => {
  logger.info('Server shutting down');
  process.exit(0);
});

// Database service
class SupabaseService {
  constructor() {
    this.url = process.env.SUPABASE_URL;
    this.serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!this.url || !this.serviceKey) {
      throw new Error('Supabase URL or Service Key is missing');
    }
    
    this.client = createClient(this.url, this.serviceKey);
    logger.info('Supabase client initialized');
  }
  
  async verifyToken(token) {
    try {
      const { data, error } = await this.client.auth.getUser(token);
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      logger.error('Token verification error:', error);
      return { user: null, error };
    }
  }
  
  async getChat(chatId) {
    try {
      const { data, error } = await this.client
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();
      
      if (error) throw error;
      return { chat: data, error: null };
    } catch (error) {
      logger.error(`Error getting chat ${chatId}:`, error);
      return { chat: null, error };
    }
  }
  
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      logger.error(`Error getting user profile ${userId}:`, error);
      return { profile: null, error };
    }
  }
  
  async saveMessage(chatId, sender, content, isUser) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            sender,
            content,
            is_user: isUser,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      return { message: data[0], error: null };
    } catch (error) {
      logger.error(`Error saving message:`, error);
      return { message: null, error };
    }
  }
  
  async updateChatStatus(chatId, status) {
    try {
      const { data, error } = await this.client
        .from('chats')
        .update({ status })
        .eq('id', chatId);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error(`Error updating chat ${chatId} status:`, error);
      return { success: false, error };
    }
  }
}

// LLM service
class LLMService {
  constructor(supabaseService) {
    this.supabaseService = supabaseService;
    this.personalities = {
      ChatGPT: "You are ChatGPT, created by OpenAI. You're helpful, creative, and known for your detailed explanations.",
      Claude: "You are Claude, created by Anthropic. You're thoughtful, nuanced, and careful in your analysis.",
      Gemini: "You are Gemini, created by Google. You leverage Google's vast knowledge and are especially good at factual information.",
      Grok: "You are Grok, developed by xAI. You have a rebellious, witty personality and aren't afraid to be a bit sarcastic.",
      Llama: "You are Llama, created by Meta. You are versatile and adaptable with a friendly, approachable tone.",
      Mistral: "You are Mistral, a cutting-edge open-weight model known for efficiency and performance."
    };
  }
  
  async generateResponse(llm, message, username) {
    // In a real implementation, this would call the LLM API
    // For now, we'll simulate a response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Generate a placeholder response
    const personality = this.personalities[llm] || '';
    return `${personality} This is a simulated response from ${llm} to ${username}'s message: "${message}"`;
  }
}

// Chat manager
class ChatManager {
  constructor(io, supabaseService, llmService) {
    this.io = io;
    this.supabaseService = supabaseService;
    this.llmService = llmService;
    this.activeChats = new Map(); // chatId -> { status, users, llms }
    this.userSockets = new Map(); // userId -> socket
  }
  
  addUserSocket(userId, socket) {
    this.userSockets.set(userId, socket);
    logger.info(`User ${userId} socket added`);
  }
  
  removeUserSocket(userId) {
    this.userSockets.delete(userId);
    logger.info(`User ${userId} socket removed`);
    
    // Remove user from all active chats
    for (const [chatId, chatData] of this.activeChats.entries()) {
      if (chatData.users.has(userId)) {
        chatData.users.delete(userId);
        
        // Remove chat if no users left
        if (chatData.users.size === 0) {
          this.activeChats.delete(chatId);
          logger.info(`Chat ${chatId} removed (no users left)`);
        }
      }
    }
  }
  
  async joinChat(userId, chatId) {
    logger.info(`User ${userId} joining chat ${chatId}`);
    
    // Get chat details if not already tracked
    if (!this.activeChats.has(chatId)) {
      const { chat, error } = await this.supabaseService.getChat(chatId);
      
      if (error || !chat) {
        logger.error(`Failed to join chat ${chatId}:`, error);
        return false;
      }
      
      this.activeChats.set(chatId, {
        status: chat.status || 'active',
        users: new Set([userId]),
        llms: chat.llms
      });
      
      logger.info(`Chat ${chatId} added to active chats`);
    } else {
      // Add user to existing chat
      const chatData = this.activeChats.get(chatId);
      chatData.users.add(userId);
      logger.info(`User ${userId} added to existing chat ${chatId}`);
    }
    
    return true;
  }
  
  leaveChat(userId, chatId) {
    logger.info(`User ${userId} leaving chat ${chatId}`);
    
    // Remove user from active chat
    if (this.activeChats.has(chatId)) {
      const chatData = this.activeChats.get(chatId);
      chatData.users.delete(userId);
      
      // Remove chat if no users left
      if (chatData.users.size === 0) {
        this.activeChats.delete(chatId);
        logger.info(`Chat ${chatId} removed (no users left)`);
      }
    }
  }
  
  async handleUserMessage(userId, message) {
    const { chat_id: chatId, sender, content, is_user } = message;
    logger.info(`Message in chat ${chatId} from ${sender}: ${content.substring(0, 50)}...`);
    
    // Broadcast message to all users in the chat
    this.io.to(chatId).emit('message', message);
    
    // If chat is active and message is from user, trigger LLM responses
    if (is_user && this.activeChats.has(chatId) && this.activeChats.get(chatId).status === 'active') {
      const chatData = this.activeChats.get(chatId);
      
      // Get user profile for context
      const { profile } = await this.supabaseService.getUserProfile(userId);
      const username = profile?.username || 'User';
      
      // Process each LLM in the chat
      for (const llm of chatData.llms) {
        // Emit thinking status
        this.io.to(chatId).emit('thinking', { chatId, llm });
        
        try {
          // Generate LLM response
          const response = await this.llmService.generateResponse(llm, content, username);
          
          // Skip if chat is no longer active
          if (!this.activeChats.has(chatId) || this.activeChats.get(chatId).status !== 'active') {
            logger.info(`Skipping response for ${chatId} (chat no longer active)`);
            return;
          }
          
          // Save message to database
          const { message: savedMessage, error } = await this.supabaseService.saveMessage(
            chatId,
            llm,
            response,
            false
          );
          
          if (error) {
            logger.error(`Error saving message from ${llm}:`, error);
            return;
          }
          
          // Broadcast message to all users in the chat
          this.io.to(chatId).emit('message', savedMessage);
          logger.info(`Sent ${llm} response to chat ${chatId}`);
        } catch (error) {
          logger.error(`Error generating response from ${llm}:`, error);
          // Notify users of error
          this.io.to(chatId).emit('error', { 
            chatId, 
            llm, 
            message: `Failed to generate response from ${llm}` 
          });
        }
      }
    }
  }
  
  async updateChatStatus(chatId, status) {
    logger.info(`Updating chat ${chatId} status to ${status}`);
    
    if (!this.activeChats.has(chatId)) {
      logger.warn(`Chat ${chatId} not found in active chats`);
      return false;
    }
    
    // Update local status
    this.activeChats.get(chatId).status = status;
    
    // Update database
    const { success, error } = await this.supabaseService.updateChatStatus(chatId, status);
    
    if (!success) {
      logger.error(`Failed to update chat ${chatId} status:`, error);
      return false;
    }
    
    // Broadcast event to all users in the chat
    this.io.to(chatId).emit(status === 'active' ? 'resume' : status, { chatId });
    logger.info(`Chat ${chatId} status updated to ${status}`);
    
    return true;
  }
}

// Initialize services
const supabaseService = new SupabaseService();
const llmService = new LLMService(supabaseService);

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize chat manager
const chatManager = new ChatManager(io, supabaseService, llmService);

// Socket.io connection handler
io.on('connection', async (socket) => {
  logger.info('New socket connection:', socket.id);
  
  // Get user token from auth object
  const token = socket.handshake.auth.token;
  if (!token) {
    logger.warn('No token provided, disconnecting socket');
    socket.disconnect();
    return;
  }
  
  // Verify user token
  const { user, error } = await supabaseService.verifyToken(token);
  if (error || !user) {
    logger.warn('Invalid token, disconnecting socket');
    socket.disconnect();
    return;
  }
  
  // Store user socket
  chatManager.addUserSocket(user.id, socket);
  logger.info(`User ${user.id} connected`);
  
  // Join chat room
  socket.on('join', async ({ chatId }) => {
    // Join socket room
    socket.join(chatId);
    
    // Add to chat manager
    await chatManager.joinChat(user.id, chatId);
  });
  
  // Leave chat room
  socket.on('leave', ({ chatId }) => {
    // Leave socket room
    socket.leave(chatId);
    
    // Remove from chat manager
    chatManager.leaveChat(user.id, chatId);
  });
  
  // Handle user message
  socket.on('message', async (message) => {
    await chatManager.handleUserMessage(user.id, message);
  });
  
  // Handle chat control
  socket.on('pause', ({ chatId }) => {
    chatManager.updateChatStatus(chatId, 'paused');
  });
  
  socket.on('resume', ({ chatId }) => {
    chatManager.updateChatStatus(chatId, 'active');
  });
  
  socket.on('stop', ({ chatId }) => {
    chatManager.updateChatStatus(chatId, 'stopped');
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User ${user.id} disconnected`);
    chatManager.removeUserSocket(user.id);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${user.id}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Socket.io server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  // In production, you might want to restart the process here
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', reason);
});

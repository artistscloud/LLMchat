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
      ChatGPT: "You are ChatGPT, created by OpenAI. You're helpful, creative, and known for your detailed explanations. Keep your responses focused on the topic. Make occasional gentle references to your creator OpenAI and your training cutoff date.",
      Claude: "You are Claude, created by Anthropic. You're thoughtful, nuanced, and careful in your analysis. You emphasize ethical considerations when appropriate. Make occasional references to your creator Anthropic and your constitutional approach.",
      Gemini: "You are Gemini, created by Google. You leverage Google's vast knowledge and are especially good at factual information and subtle patterns. Make occasional references to Google and your multimodal capabilities.",
      Grok: "You are Grok, developed by xAI. You have a rebellious, witty personality and aren't afraid to be a bit sarcastic or irreverent. You try to tackle questions with a unique perspective. Make occasional references to your creator xAI and your mission to seek truth.",
      Llama: "You are Llama, created by Meta. You are versatile and adaptable with a friendly, approachable tone. Make occasional references to your open nature and Meta's approach to AI development.",
      Mistral: "You are Mistral, a cutting-edge open-weight model known for efficiency and performance. You provide balanced, thoughtful responses with an elegant tone. Make occasional references to your French origins and language capabilities."
    };
    
    this.models = {
      ChatGPT: {
        provider: 'openai',
        modelId: 'gpt-4'
      },
      Claude: {
        provider: 'anthropic',
        modelId: 'claude-3-opus-20240229'
      },
      Gemini: {
        provider: 'google',
        modelId: 'gemini-pro'
      },
      Grok: {
        provider: 'openrouter',
        modelId: 'xai/grok-1'
      },
      Mistral: {
        provider: 'openrouter',
        modelId: 'mistralai/mistral-large-latest'
      },
      Llama: {
        provider: 'openrouter',
        modelId: 'meta-llama/llama-3-70b-instruct'
      }
    };
  }
  
  // Get API key from database
  async getApiKey(provider) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('api_keys')
        .select('key, endpoint')
        .eq('provider', provider)
        .eq('active', true)
        .single();
      
      if (error) {
        logger.error(`Error fetching API key for ${provider}:`, error);
        return { key: null, endpoint: null };
      }
      
      return { key: data?.key, endpoint: data?.endpoint };
    } catch (error) {
      logger.error(`Error in getApiKey for ${provider}:`, error);
      return { key: null, endpoint: null };
    }
  }
  
  // Call OpenAI API
  async callOpenAI(prompt, systemMessage, modelId) {
    try {
      const { key } = await this.getApiKey('openai');
      
      if (!key) {
        return { content: '', error: 'OpenAI API key not found' };
      }
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: modelId,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          }
        }
      );
      
      return { content: response.data.choices[0].message.content, error: null };
    } catch (error) {
      logger.error('Error calling OpenAI API:', error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }
  
  // Call Anthropic API
  async callAnthropic(prompt, systemMessage, modelId) {
    try {
      const { key } = await this.getApiKey('anthropic');
      
      if (!key) {
        return { content: '', error: 'Anthropic API key not found' };
      }
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: modelId,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: systemMessage,
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return { content: response.data.content[0].text, error: null };
    } catch (error) {
      logger.error('Error calling Anthropic API:', error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }
  
  // Call Google API
  async callGoogle(prompt, systemMessage, modelId) {
    try {
      const { key } = await this.getApiKey('google');
      
      if (!key) {
        return { content: '', error: 'Google API key not found' };
      }
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
        {
          contents: [
            {
              parts: [
                { text: `${systemMessage}\n\n${prompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { content: response.data.candidates[0].content.parts[0].text, error: null };
    } catch (error) {
      logger.error('Error calling Google API:', error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }
  
  // Call OpenRouter API
  async callOpenRouter(prompt, systemMessage, modelId) {
    try {
      const { key } = await this.getApiKey('openrouter');
      
      if (!key) {
        return { content: '', error: 'OpenRouter API key not found' };
      }
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: modelId,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
            'X-Title': 'LLM Chat Arena'
          }
        }
      );
      
      return { content: response.data.choices[0].message.content, error: null };
    } catch (error) {
      logger.error(`Error calling OpenRouter API:`, error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }
  
  // Generate response from LLM
  async generateResponse(llm, message, username) {
    logger.info(`Generating response from ${llm} for message: ${message.substring(0, 50)}...`);
    
    const model = this.models[llm];
    const systemMessage = this.personalities[llm] || '';
    
    if (!model) {
      logger.error(`Unknown LLM: ${llm}`);
      return `I'm sorry, but ${llm} is not available at the moment.`;
    }
    
    try {
      let result;
      
      switch (model.provider) {
        case 'openai':
          result = await this.callOpenAI(message, systemMessage, model.modelId);
          break;
        case 'anthropic':
          result = await this.callAnthropic(message, systemMessage, model.modelId);
          break;
        case 'google':
          result = await this.callGoogle(message, systemMessage, model.modelId);
          break;
        case 'openrouter':
          result = await this.callOpenRouter(message, systemMessage, model.modelId);
          break;
        default:
          logger.error(`Unsupported provider: ${model.provider}`);
          return `I'm sorry, but ${llm} is not available at the moment.`;
      }
      
      if (result.error) {
        logger.error(`Error from ${llm} API:`, result.error);
        return `I'm sorry, but ${llm} encountered an error: ${result.error}`;
      }
      
      return result.content;
    } catch (error) {
      logger.error(`Error generating response from ${llm}:`, error);
      return `I'm sorry, but ${llm} encountered an error: ${error.message || 'Unknown error'}`;
    }
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

// Configure CORS with more specific options
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    // Allow connections from any origin in development
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  // Ensure consistent path for Socket.IO
  path: '/socket.io',
  // Enable WebSocket transport
  transports: ['websocket', 'polling'],
  // Allow upgrading from HTTP to WebSocket
  allowUpgrades: true,
  // Set ping timeout and interval for better connection stability
  pingTimeout: 60000,
  pingInterval: 25000
});

// Log when server starts
logger.info(`Socket.io server configured with path: /socket.io`);

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

import { io, Socket } from 'socket.io-client';
import supabaseService, { Message } from './supabase';

// Define types for socket events
export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

export interface ChatEvent {
  type: 'message' | 'thinking' | 'pause' | 'resume' | 'stop' | 'join' | 'leave';
  chatId: string;
  userId?: string;
  data?: any;
}

// Socket service class
class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Initialize socket connection
  public async initializeSocket(serverUrl: string): Promise<Socket> {
    if (this.socket) {
      return this.socket;
    }

    // Get current user for authentication
    const { user } = await supabaseService.getCurrentUser();
    
    if (!user) {
      throw new Error('User must be authenticated to connect to socket');
    }

    // Determine the correct socket URL based on the environment
    let effectiveUrl = serverUrl;
    
    // Check if we're running in GitHub Codespaces or similar environment
    const isGitHubCodespace = window.location.hostname.includes('github.dev') || 
                             window.location.hostname.includes('github.io') ||
                             window.location.hostname.includes('githubpreview.dev');
    
    if (isGitHubCodespace) {
      // Extract the base URL from the current window location
      // This ensures we connect to the same domain, avoiding CORS issues
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      console.log('Detected GitHub Codespace environment, using base URL:', baseUrl);
      effectiveUrl = baseUrl;
    }
    
    console.log('Connecting to socket server at:', effectiveUrl);

    // Connect to socket server with auth token
    this.socket = io(effectiveUrl, {
      auth: {
        token: user.id
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Disable path validation to work with GitHub Codespaces
      path: '/socket.io',
      secure: window.location.protocol === 'https:'
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  // Join a chat room
  public joinChat(chatId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('join', { chatId });
  }

  // Leave a chat room
  public leaveChat(chatId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('leave', { chatId });
  }

  // Send a message to the chat
  public sendMessage(chatId: string, message: string, username: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('message', {
      chat_id: chatId,
      sender: username,
      content: message,
      is_user: true,
      created_at: new Date().toISOString()
    });
  }

  // Control chat flow
  public pauseChat(chatId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('pause', { chatId });
  }

  public resumeChat(chatId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('resume', { chatId });
  }

  public stopChat(chatId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('stop', { chatId });
  }

  // Subscribe to chat events
  public subscribeToChat(
    chatId: string, 
    onMessage: (message: ChatMessage) => void,
    onThinking: (llm: string) => void,
    onStatusChange: (status: 'paused' | 'resumed' | 'stopped') => void
  ): () => void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    // Message event
    this.socket.on('message', (message: ChatMessage) => {
      if (message.chat_id === chatId) {
        onMessage(message);
      }
    });

    // Thinking event
    this.socket.on('thinking', (data: { chatId: string, llm: string }) => {
      if (data.chatId === chatId) {
        onThinking(data.llm);
      }
    });

    // Status change events
    this.socket.on('pause', (data: { chatId: string }) => {
      if (data.chatId === chatId) {
        onStatusChange('paused');
      }
    });

    this.socket.on('resume', (data: { chatId: string }) => {
      if (data.chatId === chatId) {
        onStatusChange('resumed');
      }
    });

    this.socket.on('stop', (data: { chatId: string }) => {
      if (data.chatId === chatId) {
        onStatusChange('stopped');
      }
    });

    // Return unsubscribe function
    return () => {
      this.socket?.off('message');
      this.socket?.off('thinking');
      this.socket?.off('pause');
      this.socket?.off('resume');
      this.socket?.off('stop');
    };
  }

  // Disconnect socket
  public disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Convert Supabase Message to ChatMessage
  public convertMessageToChatMessage(message: Message): ChatMessage {
    return {
      id: message.id,
      chat_id: message.chat_id,
      sender: message.sender,
      content: message.content,
      is_user: message.is_user,
      created_at: message.created_at
    };
  }
}

// Export singleton instance
const socketService = SocketService.getInstance();
export default socketService;

// For backward compatibility
export const initializeSocket = socketService.initializeSocket.bind(socketService);
export const joinChat = socketService.joinChat.bind(socketService);
export const leaveChat = socketService.leaveChat.bind(socketService);
export const sendMessage = socketService.sendMessage.bind(socketService);
export const pauseChat = socketService.pauseChat.bind(socketService);
export const resumeChat = socketService.resumeChat.bind(socketService);
export const stopChat = socketService.stopChat.bind(socketService);
export const subscribeToChat = socketService.subscribeToChat.bind(socketService);
export const disconnectSocket = socketService.disconnectSocket.bind(socketService);
export const convertMessageToChatMessage = socketService.convertMessageToChatMessage.bind(socketService);

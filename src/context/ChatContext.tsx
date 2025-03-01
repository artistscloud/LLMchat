import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import supabaseService, { Chat as SupabaseChat, Message as SupabaseMessage } from '../services/supabase';
import socketService, {
  ChatMessage,
  convertMessageToChatMessage
} from '../services/socketService';
import { callLLM, llmPersonalities } from '../services/llmService';

// Define types
interface ChatContextType {
  chats: SupabaseChat[];
  currentChat: SupabaseChat | null;
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingLLMs: string[];
  createNewChat: (topic: string, selectedLLMs: string[]) => Promise<{ chatId: string | null, error: any }>;
  loadChat: (chatId: string) => Promise<void>;
  sendUserMessage: (message: string, username: string) => Promise<void>;
  pauseConversation: () => void;
  resumeConversation: () => void;
  stopConversation: () => void;
  downloadChatLog: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<SupabaseChat[]>([]);
  const [currentChat, setCurrentChat] = useState<SupabaseChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [thinkingLLMs, setThinkingLLMs] = useState<string[]>([]);
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);

  // Load user's chats
  useEffect(() => {
    const loadUserChats = async () => {
      if (!user) return;
      
      setIsLoading(true);
      const { chats: userChats, error } = await supabaseService.getUserChats(user.id);
      
      if (!error && userChats) {
        setChats(userChats);
      }
      
      setIsLoading(false);
    };
    
    loadUserChats();
  }, [user]);

  // Initialize socket
  useEffect(() => {
    const initSocket = async () => {
      if (!user || socketInitialized) return;
      
      try {
        // Get socket URL from environment variable or use window location as fallback
        let socketUrl = process.env.REACT_APP_SOCKET_URL;
        
        // If we're in GitHub Codespaces or similar environment, use the current window location
        const isGitHubCodespace = window.location.hostname.includes('github.dev') || 
                                 window.location.hostname.includes('github.io') ||
                                 window.location.hostname.includes('githubpreview.dev');
        
        if (isGitHubCodespace) {
          // Use the current window location as the base URL
          socketUrl = `${window.location.protocol}//${window.location.host}`;
          console.log('Detected GitHub Codespace environment, using URL:', socketUrl);
        } else if (!socketUrl) {
          // Fallback to localhost if not in Codespaces and no env var
          socketUrl = 'http://localhost:3002';
        }
        
        console.log('Initializing socket with URL:', socketUrl);
        await socketService.initializeSocket(socketUrl);
        setSocketInitialized(true);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };
    
    initSocket();
  }, [user, socketInitialized]);

  // Subscribe to current chat
  useEffect(() => {
    if (!currentChat || !socketInitialized) return;
    
    // Join chat room
    socketService.joinChat(currentChat.id);
    
    // Subscribe to chat events
    const unsubscribeSocket = socketService.subscribeToChat(
      currentChat.id,
      (message) => {
        setMessages((prev) => [...prev, message]);
        // Remove from thinking state if this is a response from an LLM
        if (!message.is_user) {
          setThinkingLLMs((prev) => prev.filter(llm => llm !== message.sender));
        }
      },
      (llm) => {
        // Add to thinking state
        setThinkingLLMs((prev) => [...prev, llm]);
      },
      (status) => {
        // Update chat status
        setCurrentChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: status === 'paused' ? 'paused' : status === 'resumed' ? 'active' : 'stopped'
          };
        });
      }
    );
    
    // Subscribe to Supabase real-time updates
    const subscription = supabaseService.subscribeToChat(currentChat.id, (payload) => {
      const newMessage = payload.new as SupabaseMessage;
      // Convert to ChatMessage format
      const chatMessage = socketService.convertMessageToChatMessage(newMessage);
      
      // Only add if not already in messages (to avoid duplicates with socket)
      if (!messages.some(msg => msg.id === chatMessage.id)) {
        setMessages((prev) => [...prev, chatMessage]);
      }
    });
    
    return () => {
      // Clean up subscriptions
      unsubscribeSocket();
      subscription.unsubscribe();
      // Leave chat room
      if (currentChat) {
        socketService.leaveChat(currentChat.id);
      }
    };
  }, [currentChat, socketInitialized, messages]);

  // Create a new chat
  const createNewChat = async (topic: string, selectedLLMs: string[]) => {
    if (!user) return { chatId: null, error: 'User not authenticated' };
    
    setIsLoading(true);
    
    try {
      // First, verify that the user profile exists
      const { profile, error: profileError } = await supabaseService.getUserProfile(user.id);
      
      if (profileError || !profile) {
        console.error('User profile not found:', profileError);
        // Try to create the profile if it doesn't exist
        const isAdmin = user.email === 'mriexinger@gmail.com';
        const username = isAdmin ? 'admin' : (user.email?.split('@')[0] || 'user');
        
        const { error: createProfileError } = await supabaseService.getClient()
          .from('profiles')
          .insert([
            { 
              id: user.id, 
              username, 
              email: user.email || '',
              role: isAdmin ? 'admin' : 'user',
              created_at: new Date().toISOString()
            }
          ]);
        
        if (createProfileError) {
          setIsLoading(false);
          return { chatId: null, error: `Failed to create user profile: ${createProfileError.message}` };
        }
      }
      
      // Now create the chat
      const { chat, error } = await supabaseService.createChat(user.id, topic, selectedLLMs);
      
      if (error || !chat) {
        console.error('Failed to create chat:', error);
        setIsLoading(false);
        return { chatId: null, error };
      }
      
      // Add to chats list
      setChats((prev) => [chat, ...prev]);
      
      setIsLoading(false);
      return { chatId: chat.id, error: null };
    } catch (err) {
      console.error('Error in createNewChat:', err);
      setIsLoading(false);
      return { chatId: null, error: err instanceof Error ? err.message : 'Unknown error occurred' };
    }
  };

  // Load a chat
  const loadChat = async (chatId: string) => {
    setIsLoading(true);
    
    // Get chat details
    const { chat, error: chatError } = await supabaseService.getChatById(chatId);
    
    if (chatError || !chat) {
      setIsLoading(false);
      return;
    }
    
    // Get chat messages
    const { messages: chatMessages, error: messagesError } = await supabaseService.getChatMessages(chatId);
    
    if (!messagesError && chatMessages) {
      // Convert Supabase messages to ChatMessage format
      const formattedMessages = chatMessages.map(msg => socketService.convertMessageToChatMessage(msg));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
    
    // Set current chat
    setCurrentChat({
      ...chat,
      status: chat.status || 'active'
    });
    
    setIsLoading(false);
  };

  // Send a user message
  const sendUserMessage = async (message: string, username: string) => {
    if (!currentChat) return;
    
    // Add message to chat
    await supabaseService.addMessageToChat(currentChat.id, username, message, true);
    
    // Send message via socket
    socketService.sendMessage(currentChat.id, message, username);
  };

  // Control chat flow
  const pauseConversation = () => {
    if (!currentChat) return;
    socketService.pauseChat(currentChat.id);
  };

  const resumeConversation = () => {
    if (!currentChat) return;
    socketService.resumeChat(currentChat.id);
  };

  const stopConversation = () => {
    if (!currentChat) return;
    socketService.stopChat(currentChat.id);
  };

  // Download chat log
  const downloadChatLog = () => {
    if (!currentChat || !messages.length) return;
    
    // Create content for download
    let content = `# Multi-LLM Chat - ${currentChat.topic}\n`;
    content += `# Date: ${new Date().toLocaleString()}\n`;
    content += `# Participants: ${currentChat.llms.join(', ')}\n\n`;
    
    content += messages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n\n');
    
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chat-${currentChat.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // Context value
  const value = {
    chats,
    currentChat,
    messages,
    isLoading,
    thinkingLLMs,
    createNewChat,
    loadChat,
    sendUserMessage,
    pauseConversation,
    resumeConversation,
    stopConversation,
    downloadChatLog
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Types
export interface Profile {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  topic: string;
  llms: string[];
  created_at: string;
  status?: 'active' | 'paused' | 'stopped';
}

export interface Message {
  id: string;
  chat_id: string;
  sender: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  endpoint?: string;
  active: boolean;
  created_at: string;
  last_used?: string;
}

// Supabase service class
class SupabaseService {
  private client: SupabaseClient;
  private static instance: SupabaseService;

  private constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Singleton pattern
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Get Supabase client
  public getClient(): SupabaseClient {
    return this.client;
  }

  // Authentication methods
  public async signUp(email: string, password: string) {
    console.log('Supabase signUp called with email:', email);
    try {
      const result = await this.client.auth.signUp({
        email,
        password,
      });
      
      if (result.error) {
        console.error('Supabase signUp error:', result.error);
      } else {
        console.log('Supabase signUp successful:', result.data);
      }
      
      return result;
    } catch (err) {
      console.error('Unexpected error in signUp:', err);
      throw err;
    }
  }

  public async signIn(email: string, password: string) {
    console.log('Supabase signIn called with email:', email);
    try {
      const result = await this.client.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.error) {
        console.error('Supabase signIn error:', result.error);
      } else {
        console.log('Supabase signIn successful, user:', result.data.user?.id);
      }
      
      return result;
    } catch (err) {
      console.error('Unexpected error in signIn:', err);
      throw err;
    }
  }

  public async signOut() {
    console.log('Supabase signOut called');
    try {
      const result = await this.client.auth.signOut();
      
      if (result.error) {
        console.error('Supabase signOut error:', result.error);
      } else {
        console.log('Supabase signOut successful');
      }
      
      return result;
    } catch (err) {
      console.error('Unexpected error in signOut:', err);
      throw err;
    }
  }

  public async getCurrentUser() {
    console.log('Supabase getCurrentUser called');
    try {
      const { data, error } = await this.client.auth.getUser();
      
      if (error) {
        console.error('Supabase getCurrentUser error:', error);
      } else {
        console.log('Supabase getCurrentUser successful, user:', data.user?.id || 'No user');
      }
      
      return { user: data.user, error };
    } catch (err) {
      console.error('Unexpected error in getCurrentUser:', err);
      throw err;
    }
  }

  public async getSession() {
    console.log('Supabase getSession called');
    try {
      const { data, error } = await this.client.auth.getSession();
      
      if (error) {
        console.error('Supabase getSession error:', error);
      } else {
        console.log('Supabase getSession successful, session:', data.session ? 'Valid session' : 'No session');
      }
      
      return { session: data.session, error };
    } catch (err) {
      console.error('Unexpected error in getSession:', err);
      throw err;
    }
  }

  // User profile methods
  public async getUserProfile(userId: string) {
    console.log('Supabase getUserProfile called for user ID:', userId);
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Supabase getUserProfile error:', error);
      } else {
        console.log('Supabase getUserProfile result:', data ? 'Profile found' : 'No profile found');
      }
      
      return { profile: data as Profile | null, error };
    } catch (err) {
      console.error('Unexpected error in getUserProfile:', err);
      throw err;
    }
  }

  public async updateUserProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { data, error };
  }

  // Chat methods
  public async createChat(userId: string, topic: string, selectedLLMs: string[]) {
    const { data, error } = await this.client
      .from('chats')
      .insert([
        { 
          user_id: userId, 
          topic, 
          llms: selectedLLMs,
          created_at: new Date().toISOString(),
        }
      ])
      .select();
    return { chat: data?.[0] as Chat | undefined, error };
  }

  public async getUserChats(userId: string) {
    const { data, error } = await this.client
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { chats: data as Chat[] | null, error };
  }

  public async getChatById(chatId: string) {
    const { data, error } = await this.client
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    return { chat: data as Chat | null, error };
  }

  public async getChatMessages(chatId: string) {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    return { messages: data as Message[] | null, error };
  }

  public async addMessageToChat(chatId: string, sender: string, content: string, isUser: boolean = false) {
    const { data, error } = await this.client
      .from('messages')
      .insert([
        { 
          chat_id: chatId, 
          sender, 
          content,
          is_user: isUser,
          created_at: new Date().toISOString(),
        }
      ])
      .select();
    return { message: data?.[0] as Message | undefined, error };
  }

  // Admin methods
  public async getAllUsers() {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { users: data as Profile[] | null, error };
  }

  public async updateUserRole(userId: string, role: 'user' | 'admin') {
    const { data, error } = await this.client
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    return { data, error };
  }

  public async getApiKeys() {
    const { data, error } = await this.client
      .from('api_keys')
      .select('*');
    return { apiKeys: data as ApiKey[] | null, error };
  }

  public async updateApiKey(id: string, updates: Partial<ApiKey>) {
    const { data, error } = await this.client
      .from('api_keys')
      .update(updates)
      .eq('id', id);
    return { data, error };
  }

  public async createApiKey(provider: string, key: string, endpoint?: string) {
    const { data, error } = await this.client
      .from('api_keys')
      .insert([
        { 
          provider, 
          key,
          endpoint,
          active: true,
          created_at: new Date().toISOString(),
        }
      ])
      .select();
    return { apiKey: data?.[0] as ApiKey | undefined, error };
  }

  // Real-time subscriptions
  public subscribeToChat(chatId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, callback)
      .subscribe();
  }

  // Auth state change listener
  public onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
const supabaseService = SupabaseService.getInstance();
export default supabaseService;

// For backward compatibility
export const supabase = supabaseService.getClient();
export const signUp = supabaseService.signUp.bind(supabaseService);
export const signIn = supabaseService.signIn.bind(supabaseService);
export const signOut = supabaseService.signOut.bind(supabaseService);
export const getCurrentUser = supabaseService.getCurrentUser.bind(supabaseService);
export const getSession = supabaseService.getSession.bind(supabaseService);
export const getUserProfile = supabaseService.getUserProfile.bind(supabaseService);
export const updateUserProfile = supabaseService.updateUserProfile.bind(supabaseService);
export const createChat = supabaseService.createChat.bind(supabaseService);
export const getUserChats = supabaseService.getUserChats.bind(supabaseService);
export const getChatById = supabaseService.getChatById.bind(supabaseService);
export const getChatMessages = supabaseService.getChatMessages.bind(supabaseService);
export const addMessageToChat = supabaseService.addMessageToChat.bind(supabaseService);
export const getAllUsers = supabaseService.getAllUsers.bind(supabaseService);
export const updateUserRole = supabaseService.updateUserRole.bind(supabaseService);
export const getApiKeys = supabaseService.getApiKeys.bind(supabaseService);
export const updateApiKey = supabaseService.updateApiKey.bind(supabaseService);
export const createApiKey = supabaseService.createApiKey.bind(supabaseService);
export const subscribeToChat = supabaseService.subscribeToChat.bind(supabaseService);

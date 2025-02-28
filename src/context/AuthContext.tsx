import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import supabaseService, { Profile } from '../services/supabase';

// Define types
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, username: string) => Promise<{ error: any }>;
  logout: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  // Check and create admin profile if needed
  const checkAndCreateAdminProfile = async (userId: string, email: string) => {
    // Get user profile
    const { profile: userProfile } = await supabaseService.getUserProfile(userId);
    
    if (!userProfile) {
      // Profile doesn't exist, create it
      const isAdmin = email === 'mriexinger@gmail.com';
      const username = isAdmin ? 'admin' : email.split('@')[0];
      
      const { error } = await supabaseService.getClient()
        .from('profiles')
        .insert([
          { 
            id: userId, 
            username, 
            email,
            role: isAdmin ? 'admin' : 'user',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      
      // Get the newly created profile
      const { profile: newProfile } = await supabaseService.getUserProfile(userId);
      return newProfile;
    } else if (email === 'mriexinger@gmail.com' && userProfile.role !== 'admin') {
      // Update to admin role if needed
      const { error } = await supabaseService.updateUserProfile(userId, { role: 'admin' });
      
      if (error) {
        console.error('Error updating profile to admin:', error);
        return userProfile;
      }
      
      // Get the updated profile
      const { profile: updatedProfile } = await supabaseService.getUserProfile(userId);
      return updatedProfile;
    }
    
    return userProfile;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Get session
      const { session: currentSession } = await supabaseService.getSession();
      setSession(currentSession);
      
      if (currentSession?.user) {
        setUser(currentSession.user);
        
        // Check and create profile if needed
        const userProfile = await checkAndCreateAdminProfile(
          currentSession.user.id,
          currentSession.user.email || ''
        );
        
        setProfile(userProfile);
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
    
    // Set up auth state listener
    const { data: authListener } = supabaseService.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (newSession?.user) {
        // Check and create profile if needed
        const userProfile = await checkAndCreateAdminProfile(
          newSession.user.id,
          newSession.user.email || ''
        );
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabaseService.signIn(email, password);
    setIsLoading(false);
    return { error };
  };
  
  // Register function
  const register = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    
    // Sign up user
    const { data, error } = await supabaseService.signUp(email, password);
    
    if (error) {
      setIsLoading(false);
      return { error };
    }
    
    // Create user profile
    if (data.user) {
      // Check if this is the admin email
      const isAdmin = email === 'mriexinger@gmail.com';
      
      const { error: profileError } = await supabaseService.getClient()
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            username, 
            email,
            role: isAdmin ? 'admin' : 'user',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (profileError) {
        setIsLoading(false);
        return { error: profileError };
      }
    }
    
    setIsLoading(false);
    return { error: null };
  };
  
  // Logout function
  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabaseService.signOut();
    setIsLoading(false);
    return { error };
  };
  
  // Update profile function
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('User not authenticated') };
    
    setIsLoading(true);
    const { data, error } = await supabaseService.updateUserProfile(user.id, updates);
    
    if (!error) {
      // Refresh profile
      const { profile: updatedProfile } = await supabaseService.getUserProfile(user.id);
      setProfile(updatedProfile);
    }
    
    setIsLoading(false);
    return { error };
  };
  
  // Context value
  const value = {
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
    updateProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

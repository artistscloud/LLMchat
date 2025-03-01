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
      console.log('Initializing auth state');
      
      try {
        // Get session
        const { session: currentSession, error: sessionError } = await supabaseService.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        console.log('Session retrieved:', currentSession ? 'Valid session' : 'No session');
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log('User found in session:', currentSession.user.id);
          setUser(currentSession.user);
          
          // Check and create profile if needed
          console.log('Checking for user profile');
          const userProfile = await checkAndCreateAdminProfile(
            currentSession.user.id,
            currentSession.user.email || ''
          );
          
          if (userProfile) {
            console.log('User profile found or created:', userProfile.id);
            setProfile(userProfile);
          } else {
            console.warn('Failed to get or create user profile');
          }
        } else {
          console.log('No user in session');
        }
      } catch (err) {
        console.error('Error in initializeAuth:', err);
      } finally {
        setIsLoading(false);
        console.log('Auth initialization complete');
      }
    };
    
    initializeAuth();
    
    // Set up auth state listener
    const { data: authListener } = supabaseService.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change event:', event);
      console.log('New session:', newSession ? 'Valid session' : 'No session');
      
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (newSession?.user) {
        console.log('User in new session:', newSession.user.id);
        
        // Check and create profile if needed
        console.log('Checking for user profile after auth state change');
        const userProfile = await checkAndCreateAdminProfile(
          newSession.user.id,
          newSession.user.email || ''
        );
        
        if (userProfile) {
          console.log('User profile found or created after auth state change:', userProfile.id);
          setProfile(userProfile);
        } else {
          console.warn('Failed to get or create user profile after auth state change');
          setProfile(null);
        }
      } else {
        console.log('No user in new session, clearing profile');
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
    console.log('Attempting to login with email:', email);
    
    try {
      const { data, error } = await supabaseService.signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return { error };
      }
      
      console.log('Login successful, user data:', data);
      
      // Manually set the user and session
      if (data && data.user) {
        setUser(data.user);
        setSession(data.session);
        
        // Check and create profile if needed
        const userProfile = await checkAndCreateAdminProfile(
          data.user.id,
          data.user.email || ''
        );
        
        setProfile(userProfile);
        console.log('User profile set:', userProfile);
      }
      
      setIsLoading(false);
      return { error: null };
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setIsLoading(false);
      return { error: err };
    }
  };
  
  // Register function
  const register = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    console.log('Attempting to register with email:', email, 'and username:', username);
    
    try {
      // Sign up user
      const { data, error } = await supabaseService.signUp(email, password);
      
      if (error) {
        console.error('Registration error:', error);
        setIsLoading(false);
        return { error };
      }
      
      console.log('Supabase signup successful, user data:', data);
      
      // Create user profile
      if (data.user) {
        // Check if this is the admin email
        const isAdmin = email === 'mriexinger@gmail.com';
        
        console.log('Creating user profile with ID:', data.user.id);
        
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
          console.error('Error creating profile:', profileError);
          setIsLoading(false);
          return { error: profileError };
        }
        
        console.log('Profile created successfully');
        
        // Manually set the user and session
        setUser(data.user);
        setSession(data.session);
        
        // Get the newly created profile
        const { profile: newProfile } = await supabaseService.getUserProfile(data.user.id);
        setProfile(newProfile);
        
        console.log('User profile set:', newProfile);
      } else {
        console.warn('No user data returned from signup');
      }
      
      setIsLoading(false);
      return { error: null };
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setIsLoading(false);
      return { error: err };
    }
  };
  
  // Logout function
  const logout = async () => {
    setIsLoading(true);
    console.log('Attempting to logout');
    
    try {
      const { error } = await supabaseService.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        setIsLoading(false);
        return { error };
      }
      
      console.log('Logout successful');
      
      // Manually clear user state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      setIsLoading(false);
      return { error: null };
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      setIsLoading(false);
      return { error: err };
    }
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

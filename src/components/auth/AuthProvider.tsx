
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
            // Clear corrupted session
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();
            setUser(null);
          }
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Clear any existing corrupted session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username
          }
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Please check your email to confirm your account"
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear all local storage regardless of error
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      if (error) {
        console.warn('Sign out error (continuing anyway):', error);
      }
      
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Force clear session even if signOut fails
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      setUser(null);
      });
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

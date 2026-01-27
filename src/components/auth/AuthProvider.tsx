import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: AppProfile | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, username?: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  profile: null,
  refreshProfile: async () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  signInWithGoogle: async () => ({})
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppProfile | null>(null);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      return;
    }

    setProfile((data as AppProfile) ?? null);
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    await loadProfile(user.id);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser?.id) {
        loadProfile(nextUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser?.id) {
          loadProfile(nextUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: keep profile synced across the whole app
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const next = payload.new as any;
          setProfile({
            id: next.id,
            username: next.username ?? null,
            display_name: next.display_name ?? null,
            avatar_url: next.avatar_url ?? null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, username?: string) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: username ? {
        data: {
          username: username
        }
      } : undefined
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      profile,
      refreshProfile,
      signIn, 
      signUp, 
      signOut, 
      signInWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
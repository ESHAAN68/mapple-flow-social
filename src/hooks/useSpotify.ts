import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface SpotifyProfile {
  spotify_user_id: string | null;
  spotify_display_name: string | null;
  spotify_premium: boolean | null;
  spotify_connected_at: string | null;
}

export const useSpotify = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSpotifyConnection();
    }
  }, [user]);

  const checkSpotifyConnection = async () => {
    try {
      setIsLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('spotify_user_id, spotify_display_name, spotify_premium, spotify_connected_at')
        .eq('id', user?.id)
        .single();

      if (profile?.spotify_user_id) {
        setIsConnected(true);
        setSpotifyProfile(profile);
      } else {
        setIsConnected(false);
        setSpotifyProfile(null);
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setIsConnected(false);
      setSpotifyProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setSpotifyProfile(null);
    } else {
      // Refresh profile data
      checkSpotifyConnection();
    }
  };

  return {
    isConnected,
    spotifyProfile,
    isLoading,
    handleConnectionChange,
    refreshConnection: checkSpotifyConnection
  };
};
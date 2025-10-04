import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SpotifyConnectProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  spotifyProfile?: any;
}

export const SpotifyConnect: React.FC<SpotifyConnectProps> = ({
  isConnected,
  onConnectionChange,
  spotifyProfile
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get auth URL from edge function (uses stored SPOTIFY_CLIENT_ID)
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'getAuthUrl' }
      });

      if (error) throw error;
      const authUrl = (data as any)?.authUrl;
      if (!authUrl) throw new Error('Failed to get authorization URL');
      
      // Redirect to Spotify authorization
      window.location.href = authUrl;

    } catch (error) {
      console.error('Spotify connection error:', error);
      toast.error('Failed to connect to Spotify. Please try again.');
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('spotify_user_id, spotify_display_name, spotify_premium')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.spotify_user_id) {
        onConnectionChange(true);
        toast.success(`🎵 Connected to Spotify as ${profile.spotify_display_name}!`);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'disconnect' }
      });

      if (error) throw error;

      onConnectionChange(false);
      toast.success('Disconnected from Spotify');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect from Spotify');
    }
  };

  if (isConnected) {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm"
      >
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium">
          {spotifyProfile?.spotify_display_name || 'Spotify Connected'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="h-6 px-2 text-xs text-green-600 hover:text-green-800"
        >
          Disconnect
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-[#1DB954] hover:bg-[#1ed760] text-white transition-all duration-200 hover:scale-105 shadow-lg"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Music className="w-4 h-4 mr-2" />
          Connect Spotify
        </>
      )}
    </Button>
  );
};
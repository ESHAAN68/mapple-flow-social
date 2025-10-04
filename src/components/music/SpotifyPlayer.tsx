import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  Music,
  Heart,
  Shuffle,
  Repeat,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  preview_url?: string;
}

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: Track | null;
  device: {
    id: string;
    name: string;
    volume_percent: number;
  } | null;
  shuffle_state: boolean;
  repeat_state: 'track' | 'context' | 'off';
}

export const SpotifyPlayer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSpotifyToken();
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (accessToken) {
      // Poll for playback state every 2 seconds
      pollInterval.current = setInterval(fetchPlaybackState, 2000);
      fetchPlaybackState(); // Initial fetch
    }
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [accessToken]);

  const loadSpotifyToken = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Query spotify_credentials table for access token
      const { data: credentials } = await supabase
        .from('spotify_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (credentials?.access_token) {
        setAccessToken(credentials.access_token);
      }
    } catch (error) {
      console.error('Error loading Spotify token:', error);
    }
  };

  const fetchPlaybackState = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 204) {
        // No content - no active device
        setPlaybackState(null);
        return;
      }

      if (response.status === 401) {
        // Token expired, try to refresh
        await refreshToken();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setPlaybackState(data);
        if (data.device?.volume_percent !== undefined) {
          setVolume(data.device.volume_percent);
        }
      }
    } catch (error) {
      console.error('Error fetching playback state:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'refreshToken' }
      });

      if (error) throw error;

      setAccessToken(data.access_token);
    } catch (error) {
      console.error('Token refresh error:', error);
      toast.error('Spotify session expired. Please reconnect.');
    }
  };

  const spotifyRequest = async (endpoint: string, method = 'PUT', body?: any) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        await refreshToken();
      } else if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Spotify API error');
      }

      // Refresh playback state after a successful command
      setTimeout(fetchPlaybackState, 500);
    } catch (error) {
      console.error('Spotify request error:', error);
      toast.error('Failed to control playback. Make sure Spotify is open on a device.');
    }
  };

  const togglePlayback = () => {
    if (playbackState?.is_playing) {
      spotifyRequest('/pause');
    } else {
      spotifyRequest('/play');
    }
  };

  const skipTrack = (direction: 'next' | 'previous') => {
    spotifyRequest(`/${direction}`);
  };

  const setVolumeLevel = async (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    await spotifyRequest(`/volume?volume_percent=${vol}`);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    spotifyRequest(`/volume?volume_percent=${newMuteState ? 0 : volume}`);
  };

  const toggleShuffle = () => {
    spotifyRequest(`/shuffle?state=${!playbackState?.shuffle_state}`);
  };

  const toggleRepeat = () => {
    const states = ['off', 'context', 'track'];
    const currentIndex = states.indexOf(playbackState?.repeat_state || 'off');
    const nextState = states[(currentIndex + 1) % states.length];
    spotifyRequest(`/repeat?state=${nextState}`);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts - after function declarations
  useKeyboardShortcuts({
    onPlayPause: togglePlayback,
    onNext: () => skipTrack('next'),
    onPrevious: () => skipTrack('previous'),
    onVolumeUp: () => setVolumeLevel([Math.min(100, volume + 10)]),
    onVolumeDown: () => setVolumeLevel([Math.max(0, volume - 10)]),
    onMute: toggleMute,
    isEnabled: !!accessToken
  });

  if (!accessToken) {
    return null; // Don't show if not connected
  }

  const currentTrack = playbackState?.item;
  const progress = playbackState?.progress_ms || 0;
  const duration = currentTrack?.duration_ms || 0;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Card className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-xl border-white/10 text-white shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ height: 80 }}
              animate={{ height: 'auto' }}
              exit={{ height: 80 }}
              className="w-80 p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Now Playing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Keyboard className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="text-xs space-y-1">
                        <div><kbd className="bg-gray-600 px-1 rounded">Space</kbd> Play/Pause</div>
                        <div><kbd className="bg-gray-600 px-1 rounded">Shift + ←/→</kbd> Previous/Next</div>
                        <div><kbd className="bg-gray-600 px-1 rounded">Shift + ↑/↓</kbd> Volume</div>
                        <div><kbd className="bg-gray-600 px-1 rounded">M</kbd> Mute</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {currentTrack ? (
                <div className="space-y-4">
                  {/* Album Art and Track Info */}
                  <div className="flex gap-3">
                    <img
                      src={currentTrack.album.images[0]?.url || '/placeholder.svg'}
                      alt={currentTrack.album.name}
                      className="w-16 h-16 rounded-lg shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {currentTrack.name}
                      </h3>
                      <p className="text-sm text-white/70 truncate">
                        {currentTrack.artists.map(a => a.name).join(', ')}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {currentTrack.album.name}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <div
                        className="bg-green-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>{formatTime(progress)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleShuffle}
                      className={`h-8 w-8 p-0 ${
                        playbackState?.shuffle_state 
                          ? 'text-green-400 hover:text-green-300' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipTrack('previous')}
                      className="h-10 w-10 p-0 text-white hover:text-green-400 hover:bg-white/10"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={togglePlayback}
                      className="h-12 w-12 p-0 bg-green-500 hover:bg-green-400 text-black rounded-full shadow-lg hover:scale-105 transition-all"
                    >
                      {playbackState?.is_playing ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipTrack('next')}
                      className="h-10 w-10 p-0 text-white hover:text-green-400 hover:bg-white/10"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleRepeat}
                      className={`h-8 w-8 p-0 ${
                        playbackState?.repeat_state !== 'off'
                          ? 'text-green-400 hover:text-green-300' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                      {playbackState?.repeat_state === 'track' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
                      )}
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="h-8 w-8 p-0 text-white/60 hover:text-white"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={setVolumeLevel}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-white/60 w-8">
                      {Math.round(isMuted ? 0 : volume)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No music playing</p>
                  <p className="text-xs mt-1">Open Spotify and start playing music</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ height: 'auto' }}
              animate={{ height: 80 }}
              exit={{ height: 'auto' }}
              className="w-80 h-20 p-3 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              {currentTrack ? (
                <div className="flex items-center gap-3 h-full">
                  <div className="relative">
                    <img
                      src={currentTrack.album.images[2]?.url || '/placeholder.svg'}
                      alt={currentTrack.album.name}
                      className="w-14 h-14 rounded-lg shadow-lg"
                    />
                    {playbackState?.is_playing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate text-sm">
                      {currentTrack.name}
                    </h4>
                    <p className="text-xs text-white/70 truncate">
                      {currentTrack.artists.map(a => a.name).join(', ')}
                    </p>
                    
                    {/* Mini progress bar */}
                    <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                      <div
                        className="bg-green-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayback();
                      }}
                      className="h-10 w-10 p-0 text-white hover:text-green-400 hover:bg-white/10"
                    >
                      {playbackState?.is_playing ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                      }}
                      className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/60">
                  <Music className="w-6 h-6 mr-2 opacity-50" />
                  <span className="text-sm">Open Spotify to see music</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
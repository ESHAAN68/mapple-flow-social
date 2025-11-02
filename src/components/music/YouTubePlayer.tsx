import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, SkipForward, Volume2, Minimize2, Maximize2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useYouTubeStore, YouTubeVideo } from '@/store/youtubeStore';
import { useAchievementStore } from '@/store/achievementStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    currentVideo,
    isPlaying,
    queue,
    volume,
    isMinimized,
    setCurrentVideo,
    setIsPlaying,
    addToQueue,
    removeFromQueue,
    playNext,
    addSearchTerm,
    setVolume,
    setIsMinimized,
  } = useYouTubeStore();
  
  const { incrementYouTubeSearches, incrementYouTubeWatchTime } = useAchievementStore();

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize player when video changes
  useEffect(() => {
    if (currentVideo && window.YT && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              playNext();
            }
          },
        },
      });
    } else if (currentVideo && playerRef.current) {
      playerRef.current.loadVideoById(currentVideo.id);
    }
  }, [currentVideo]);

  // Handle volume changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery },
      });

      if (error) throw error;
      
      setSearchResults(data.videos || []);
      addSearchTerm(searchQuery);
      incrementYouTubeSearches();
      setIsExpanded(true);
    } catch (error: any) {
      console.error('YouTube search error:', error);
      toast.error('Failed to search YouTube', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayVideo = (video: YouTubeVideo) => {
    setCurrentVideo(video);
    setIsPlaying(true);
    setIsExpanded(false);
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  if (!currentVideo && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-24 right-6 z-50"
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #FF0000, #CC0000)' }}
        >
          <Search className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-6 right-6 z-50 ${
          isMinimized ? 'w-80' : isExpanded ? 'w-[600px]' : 'w-96'
        }`}
      >
        <div className="bg-card border-2 border-[#FF0000] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#FF0000] font-bold text-sm">YT</span>
              </div>
              <span className="text-white font-semibold">YouTube Music</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setCurrentVideo(null);
                  setIsExpanded(false);
                  if (playerRef.current) {
                    playerRef.current.stopVideo();
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Search Section */}
              <div className="p-4 bg-background border-b">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for music..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Player or Search Results */}
              {isExpanded && searchResults.length > 0 ? (
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-2">
                    {searchResults.map((video) => (
                      <motion.div
                        key={video.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => handlePlayVideo(video)}
                              className="h-7"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                addToQueue(video);
                                toast.success('Added to queue');
                              }}
                              className="h-7"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Queue
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : currentVideo ? (
                <>
                  {/* Video Player */}
                  <div ref={playerContainerRef} className="relative bg-black">
                    <div id="youtube-player" className="w-full h-56" />
                  </div>

                  {/* Controls */}
                  <div className="p-4 bg-background">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-medium text-sm line-clamp-1">{currentVideo.title}</h4>
                        <p className="text-xs text-muted-foreground">{currentVideo.channel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={togglePlayPause}>
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={playNext}
                          disabled={queue.length === 0}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>

                    {/* Queue */}
                    {queue.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          Up next ({queue.length})
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {queue.slice(0, 3).map((video) => (
                            <div
                              key={video.id}
                              className="flex items-center gap-2 text-xs p-1 hover:bg-muted rounded"
                            >
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-12 h-8 object-cover rounded"
                              />
                              <span className="flex-1 line-clamp-1">{video.title}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeFromQueue(video.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Search for music to get started</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

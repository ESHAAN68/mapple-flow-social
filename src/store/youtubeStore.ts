import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration?: string;
}

interface YouTubeState {
  currentVideo: YouTubeVideo | null;
  isPlaying: boolean;
  queue: YouTubeVideo[];
  searchHistory: string[];
  volume: number;
  isMinimized: boolean;
  
  setCurrentVideo: (video: YouTubeVideo | null) => void;
  setIsPlaying: (playing: boolean) => void;
  addToQueue: (video: YouTubeVideo) => void;
  removeFromQueue: (videoId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  addSearchTerm: (term: string) => void;
  setVolume: (volume: number) => void;
  setIsMinimized: (minimized: boolean) => void;
}

export const useYouTubeStore = create<YouTubeState>()(
  persist(
    (set, get) => ({
      currentVideo: null,
      isPlaying: false,
      queue: [],
      searchHistory: [],
      volume: 50,
      isMinimized: false,
      
      setCurrentVideo: (video) => set({ currentVideo: video }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      addToQueue: (video) => {
        set((state) => ({
          queue: [...state.queue, video],
        }));
      },
      
      removeFromQueue: (videoId) => {
        set((state) => ({
          queue: state.queue.filter((v) => v.id !== videoId),
        }));
      },
      
      clearQueue: () => set({ queue: [] }),
      
      playNext: () => {
        const { queue } = get();
        if (queue.length > 0) {
          const [nextVideo, ...remainingQueue] = queue;
          set({
            currentVideo: nextVideo,
            queue: remainingQueue,
            isPlaying: true,
          });
        }
      },
      
      addSearchTerm: (term) => {
        set((state) => ({
          searchHistory: [term, ...state.searchHistory.filter(t => t !== term)].slice(0, 10),
        }));
      },
      
      setVolume: (volume) => set({ volume }),
      setIsMinimized: (minimized) => set({ isMinimized: minimized }),
    }),
    {
      name: 'youtube-storage',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MoodType = 'happy' | 'sad' | 'energetic' | 'relaxed' | 'focused' | 'creative';

export interface MoodEmoji {
  emoji: string;
  label: string;
  color: string;
}

export const moodEmojis: Record<MoodType, MoodEmoji> = {
  happy: { emoji: '😊', label: 'Happy', color: '#ffd700' },
  sad: { emoji: '😢', label: 'Sad', color: '#6495ed' },
  energetic: { emoji: '⚡', label: 'Energetic', color: '#ff4500' },
  relaxed: { emoji: '😌', label: 'Relaxed', color: '#3cb371' },
  focused: { emoji: '🎯', label: 'Focused', color: '#4169e1' },
  creative: { emoji: '🎨', label: 'Creative', color: '#da70d6' },
};

interface MoodEntry {
  mood: MoodType;
  timestamp: number;
}

interface MoodState {
  currentMood: MoodType | null;
  moodHistory: MoodEntry[];
  setMood: (mood: MoodType) => void;
  getMoodStreak: () => number;
  getMostCommonMood: () => MoodType | null;
  getTodayMoodChanges: () => number;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      currentMood: null,
      moodHistory: [],
      
      setMood: (mood: MoodType) => {
        set((state) => ({
          currentMood: mood,
          moodHistory: [
            ...state.moodHistory,
            { mood, timestamp: Date.now() }
          ].slice(-100), // Keep last 100 entries
        }));
      },
      
      getMoodStreak: () => {
        const { moodHistory, currentMood } = get();
        if (!currentMood || moodHistory.length === 0) return 0;
        
        let streak = 0;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        // Group by day and check for consecutive days with same mood
        const dayGroups = new Map<string, MoodType>();
        
        moodHistory.forEach((entry) => {
          const dayKey = new Date(entry.timestamp).toDateString();
          dayGroups.set(dayKey, entry.mood);
        });
        
        // Check consecutive days backwards from today
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(now - i * oneDayMs).toDateString();
          const dayMood = dayGroups.get(checkDate);
          
          if (dayMood === currentMood) {
            streak++;
          } else if (dayGroups.has(checkDate)) {
            break;
          }
        }
        
        return streak;
      },
      
      getMostCommonMood: () => {
        const { moodHistory } = get();
        if (moodHistory.length === 0) return null;
        
        const moodCounts = moodHistory.reduce((acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          return acc;
        }, {} as Record<MoodType, number>);
        
        return Object.entries(moodCounts).reduce((a, b) => 
          a[1] > b[1] ? a : b
        )[0] as MoodType;
      },
      
      getTodayMoodChanges: () => {
        const { moodHistory } = get();
        const today = new Date().toDateString();
        
        return moodHistory.filter(
          (entry) => new Date(entry.timestamp).toDateString() === today
        ).length;
      },
    }),
    {
      name: 'mood-storage',
    }
  )
);

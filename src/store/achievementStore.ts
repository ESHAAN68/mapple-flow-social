import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

interface AchievementState {
  achievements: Achievement[];
  stats: {
    clicks: number;
    timeSpent: number;
    pageViews: number;
    idleTime: number;
    moodsExplored: Set<string>;
    moodChangesToday: number;
    consecutiveMoodDays: number;
    youtubeSearches: number;
    youtubeWatchTime: number;
  };
  unlockAchievement: (id: string) => void;
  incrementClicks: () => void;
  incrementTimeSpent: () => void;
  incrementPageViews: () => void;
  incrementIdleTime: () => void;
  checkMoodAchievements: () => void;
  incrementYouTubeSearches: () => void;
  incrementYouTubeWatchTime: () => void;
}

const achievementsList: Achievement[] = [
  {
    id: 'first-click',
    title: 'The Beginning',
    description: 'You clicked something. Wow.',
    icon: '👆',
    unlocked: false,
  },
  {
    id: 'click-master',
    title: 'Click Master',
    description: 'Clicked 100 times. Your mouse is tired.',
    icon: '🖱️',
    unlocked: false,
  },
  {
    id: 'procrastinator',
    title: 'Professional Procrastinator',
    description: 'Spent 5 minutes doing nothing.',
    icon: '⏰',
    unlocked: false,
  },
  {
    id: 'explorer',
    title: 'Digital Explorer',
    description: 'Visited 10 different pages.',
    icon: '🗺️',
    unlocked: false,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Using the app past midnight. Go to sleep!',
    icon: '🦉',
    unlocked: false,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Clicked 10 times in 1 second.',
    icon: '⚡',
    unlocked: false,
  },
  {
    id: 'zen-master',
    title: 'Zen Master',
    description: "Didn't click anything for 2 minutes.",
    icon: '🧘',
    unlocked: false,
  },
  {
    id: 'dedication',
    title: 'Dedication',
    description: 'Spent 10 minutes on the app.',
    icon: '💪',
    unlocked: false,
  },
  // Mood achievements
  {
    id: 'mood-explorer',
    title: 'Mood Explorer',
    description: 'Try all 6 moods',
    icon: '🌈',
    unlocked: false,
  },
  {
    id: 'consistent-vibes',
    title: 'Consistent Vibes',
    description: 'Maintain same mood for 3 days',
    icon: '📊',
    unlocked: false,
  },
  {
    id: 'mood-swinger',
    title: 'Mood Swinger',
    description: 'Change moods 10 times in one day',
    icon: '🎢',
    unlocked: false,
  },
  {
    id: 'self-aware',
    title: 'Self Aware',
    description: 'Track moods for 7 consecutive days',
    icon: '🧠',
    unlocked: false,
  },
  // YouTube achievements
  {
    id: 'music-explorer',
    title: 'Music Explorer',
    description: 'Search for 10 different songs',
    icon: '🎵',
    unlocked: false,
  },
  {
    id: 'dj-mode',
    title: 'DJ Mode',
    description: 'Create a queue of 20+ videos',
    icon: '🎧',
    unlocked: false,
  },
  {
    id: 'music-lover',
    title: 'Music Lover',
    description: 'Watch 1 hour of music',
    icon: '❤️',
    unlocked: false,
  },
];

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: achievementsList,
    stats: {
      clicks: 0,
      timeSpent: 0,
      pageViews: 0,
      idleTime: 0,
      moodsExplored: new Set<string>(),
      moodChangesToday: 0,
      consecutiveMoodDays: 0,
      youtubeSearches: 0,
      youtubeWatchTime: 0,
    },
      unlockAchievement: (id) =>
        set((state) => ({
          achievements: state.achievements.map((achievement) =>
            achievement.id === id && !achievement.unlocked
              ? { ...achievement, unlocked: true, unlockedAt: Date.now() }
              : achievement
          ),
        })),
      incrementClicks: () => {
        const state = get();
        const newClicks = state.stats.clicks + 1;
        set({ stats: { ...state.stats, clicks: newClicks } });

        // Check achievements
        if (newClicks === 1) state.unlockAchievement('first-click');
        if (newClicks === 100) state.unlockAchievement('click-master');
      },
      incrementTimeSpent: () => {
        const state = get();
        const newTime = state.stats.timeSpent + 1;
        set({ stats: { ...state.stats, timeSpent: newTime } });

        // Check achievements
        if (newTime === 300) state.unlockAchievement('procrastinator');
        if (newTime === 600) state.unlockAchievement('dedication');

        // Night owl check
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 6) {
          state.unlockAchievement('night-owl');
        }
      },
      incrementPageViews: () => {
        const state = get();
        const newViews = state.stats.pageViews + 1;
        set({ stats: { ...state.stats, pageViews: newViews } });

        if (newViews === 10) state.unlockAchievement('explorer');
      },
      incrementIdleTime: () => {
        const state = get();
        const newIdle = state.stats.idleTime + 1;
        set({ stats: { ...state.stats, idleTime: newIdle } });

        if (newIdle === 120) state.unlockAchievement('zen-master');
      },
      
      checkMoodAchievements: () => {
        set((state) => {
          const achievements = [...state.achievements];
          const { moodsExplored, moodChangesToday, consecutiveMoodDays } = state.stats;

          // Mood Explorer - try all 6 moods
          if (moodsExplored.size >= 6 && !achievements.find(a => a.id === 'mood-explorer')?.unlocked) {
            const idx = achievements.findIndex(a => a.id === 'mood-explorer');
            if (idx !== -1) achievements[idx] = { ...achievements[idx], unlocked: true };
          }

          // Mood Swinger - 10 changes in one day
          if (moodChangesToday >= 10 && !achievements.find(a => a.id === 'mood-swinger')?.unlocked) {
            const idx = achievements.findIndex(a => a.id === 'mood-swinger');
            if (idx !== -1) achievements[idx] = { ...achievements[idx], unlocked: true };
          }

          // Consistent Vibes - 3 consecutive days
          if (consecutiveMoodDays >= 3 && !achievements.find(a => a.id === 'consistent-vibes')?.unlocked) {
            const idx = achievements.findIndex(a => a.id === 'consistent-vibes');
            if (idx !== -1) achievements[idx] = { ...achievements[idx], unlocked: true };
          }

          // Self Aware - 7 consecutive days
          if (consecutiveMoodDays >= 7 && !achievements.find(a => a.id === 'self-aware')?.unlocked) {
            const idx = achievements.findIndex(a => a.id === 'self-aware');
            if (idx !== -1) achievements[idx] = { ...achievements[idx], unlocked: true };
          }

          return { achievements };
        });
      },
      
      incrementYouTubeSearches: () => {
        set((state) => {
          const newSearches = state.stats.youtubeSearches + 1;
          const achievements = [...state.achievements];

          if (newSearches >= 10 && !achievements.find(a => a.id === 'music-explorer')?.unlocked) {
            const idx = achievements.findIndex(a => a.id === 'music-explorer');
            if (idx !== -1) achievements[idx] = { ...achievements[idx], unlocked: true };
          }

          return {
            stats: { ...state.stats, youtubeSearches: newSearches },
            achievements,
          };
        });
      },
      
      incrementYouTubeWatchTime: () => {
        set((state) => {
          const newWatchTime = state.stats.youtubeWatchTime + 1;
          const achievements = [...state.achievements];

          if (newWatchTime >= 3600 && !achievements.find(a => a.id === 'music-lover')?.unlocked) {
            const idx = achievements.findIndex(a => a.id === 'music-lover');
            if (idx !== -1) achievements[idx] = { ...achievements[idx], unlocked: true };
          }

          return {
            stats: { ...state.stats, youtubeWatchTime: newWatchTime },
            achievements,
          };
        });
      },
    }),
    {
      name: 'achievement-storage',
    }
  )
);

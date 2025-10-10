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
  };
  unlockAchievement: (id: string) => void;
  incrementClicks: () => void;
  incrementTimeSpent: () => void;
  incrementPageViews: () => void;
  incrementIdleTime: () => void;
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
    }),
    {
      name: 'achievement-storage',
    }
  )
);

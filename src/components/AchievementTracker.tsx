import React, { useEffect, useRef } from 'react';
import { useAchievementStore } from '@/store/achievementStore';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

export const AchievementTracker: React.FC = () => {
  const { incrementClicks, incrementTimeSpent, incrementPageViews, incrementIdleTime, achievements } = useAchievementStore();
  const location = useLocation();
  const lastClickTime = useRef<number>(0);
  const clickCount = useRef<number>(0);
  const lastActivityTime = useRef<number>(Date.now());
  const previousAchievements = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Track page views
    incrementPageViews();
  }, [location.pathname, incrementPageViews]);

  useEffect(() => {
    // Initialize previous achievements
    achievements.forEach(a => {
      if (a.unlocked) previousAchievements.current.add(a.id);
    });

    // Track clicks
    const handleClick = () => {
      incrementClicks();
      lastActivityTime.current = Date.now();

      // Speed demon tracking
      const now = Date.now();
      if (now - lastClickTime.current < 1000) {
        clickCount.current++;
        if (clickCount.current === 10) {
          useAchievementStore.getState().unlockAchievement('speed-demon');
        }
      } else {
        clickCount.current = 1;
      }
      lastClickTime.current = now;
    };

    // Track time spent
    const timeInterval = setInterval(() => {
      incrementTimeSpent();
    }, 1000);

    // Track idle time
    const idleInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityTime.current > 1000) {
        incrementIdleTime();
      }
    }, 1000);

    // Track mouse movement to reset idle
    const handleActivity = () => {
      lastActivityTime.current = Date.now();
      useAchievementStore.setState((state) => ({
        stats: { ...state.stats, idleTime: 0 },
      }));
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);

    return () => {
      clearInterval(timeInterval);
      clearInterval(idleInterval);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, [incrementClicks, incrementTimeSpent, incrementIdleTime]);

  // Show toast for new achievements
  useEffect(() => {
    achievements.forEach((achievement) => {
      if (achievement.unlocked && !previousAchievements.current.has(achievement.id)) {
        previousAchievements.current.add(achievement.id);
        toast.success(
          <div className="flex items-center gap-3">
            <span className="text-3xl">{achievement.icon}</span>
            <div>
              <p className="font-bold">Achievement Unlocked!</p>
              <p className="text-sm">{achievement.title}</p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
          </div>,
          {
            duration: 5000,
          }
        );
      }
    });
  }, [achievements]);

  return null;
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore, moodEmojis, MoodType } from '@/store/moodStore';
import { useAchievementStore } from '@/store/achievementStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const MoodSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentMood, setMood, getMoodStreak, getTodayMoodChanges } = useMoodStore();
  const { checkMoodAchievements } = useAchievementStore();

  const handleMoodSelect = (mood: MoodType) => {
    setMood(mood);
    checkMoodAchievements();
    
    // Apply mood theme
    document.documentElement.setAttribute('data-mood', mood);
    
    toast.success(`Mood set to ${moodEmojis[mood].emoji} ${moodEmojis[mood].label}`, {
      description: getMoodStreak() > 1 
        ? `${getMoodStreak()} day streak!` 
        : 'Keep tracking your mood!',
    });
    
    setIsOpen(false);
  };

  const moods = Object.entries(moodEmojis) as [MoodType, typeof moodEmojis[MoodType]][];

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed top-20 right-6 z-40"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          style={{
            background: currentMood 
              ? `linear-gradient(135deg, ${moodEmojis[currentMood].color}, ${moodEmojis[currentMood].color}dd)`
              : 'var(--gradient-primary)',
          }}
        >
          <span className="text-2xl">
            {currentMood ? moodEmojis[currentMood].emoji : '😊'}
          </span>
        </Button>
      </motion.div>

      {/* Mood Selection Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Mood Grid */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed top-36 right-6 z-50 bg-card border border-border rounded-2xl p-6 shadow-2xl"
              style={{ width: '320px' }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">How are you feeling?</h3>
                <p className="text-sm text-muted-foreground">
                  Select your current mood
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {moods.map(([moodKey, moodData], index) => (
                  <motion.button
                    key={moodKey}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMoodSelect(moodKey)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl
                      border-2 transition-all cursor-pointer
                      ${currentMood === moodKey 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50 bg-background'
                      }
                    `}
                  >
                    <span className="text-3xl mb-1">{moodData.emoji}</span>
                    <span className="text-xs font-medium">{moodData.label}</span>
                  </motion.button>
                ))}
              </div>

              {currentMood && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Streak:</span>
                    <span className="font-semibold">{getMoodStreak()} days</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Today:</span>
                    <span className="font-semibold">{getTodayMoodChanges()} changes</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

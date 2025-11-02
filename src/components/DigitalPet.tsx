import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore, moodEmojis } from '@/store/moodStore';

type PetMood = 'sleeping' | 'bored' | 'playing' | 'vibing';

const petEmojis = {
  sleeping: '😴',
  bored: '🙄',
  playing: '🐱',
  vibing: '😎',
};

const petThoughts = {
  sleeping: 'zzz...',
  bored: 'so boring...',
  playing: 'wheee!',
  vibing: 'living my best life',
};

// Mood-based pet thoughts
const moodBasedThoughts: Record<string, string> = {
  happy: 'you seem happy! 😊',
  sad: 'sending hugs 🤗',
  energetic: 'let\'s gooo! ⚡',
  relaxed: 'chilling with you 😌',
  focused: 'you got this! 🎯',
  creative: 'feeling artsy! 🎨',
};

export const DigitalPet: React.FC = () => {
  const [mood, setMood] = useState<PetMood>('bored');
  const [showThought, setShowThought] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const { currentMood } = useMoodStore();
  const [thoughtText, setThoughtText] = useState('');

  // React to user's mood
  useEffect(() => {
    if (currentMood) {
      // Pet mirrors user mood
      if (currentMood === 'happy') setMood('vibing');
      else if (currentMood === 'energetic') setMood('playing');
      else if (currentMood === 'sad') setMood('sleeping');
      else setMood('bored');
      
      setThoughtText(moodBasedThoughts[currentMood] || petThoughts[mood]);
      setShowThought(true);
      setTimeout(() => setShowThought(false), 3000);
    }
  }, [currentMood]);

  useEffect(() => {
    // Random mood changes
    const moodInterval = setInterval(() => {
      if (!currentMood) {
        const moods: PetMood[] = ['sleeping', 'bored', 'playing', 'vibing'];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        setMood(randomMood);
        setThoughtText(petThoughts[randomMood]);
        setShowThought(true);
        setTimeout(() => setShowThought(false), 3000);
      }
    }, 8000);

    // Random position changes (sometimes)
    const moveInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setPosition({
          x: Math.random() * 80,
          y: Math.random() * 80,
        });
      }
    }, 15000);

    return () => {
      clearInterval(moodInterval);
      clearInterval(moveInterval);
    };
  }, []);

  return (
    <motion.div
      className="fixed z-50 pointer-events-auto cursor-pointer"
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
      animate={{
        scale: mood === 'playing' ? [1, 1.2, 1] : 1,
        rotate: mood === 'vibing' ? [0, 10, -10, 0] : 0,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      onClick={() => {
        setMood('vibing');
        setThoughtText(currentMood ? moodBasedThoughts[currentMood] : 'you clicked me!');
        setShowThought(true);
        setTimeout(() => setShowThought(false), 2000);
      }}
    >
      <div className="relative">
        {/* Pet */}
        <div className="text-6xl filter drop-shadow-lg">
          {petEmojis[mood]}
        </div>

        {/* Thought bubble */}
        <AnimatePresence>
          {showThought && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <div className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-2xl px-4 py-2 shadow-lg">
                <p className="text-sm font-medium text-foreground">
                  {thoughtText || petThoughts[mood]}
                </p>
              </div>
              {/* Bubble tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

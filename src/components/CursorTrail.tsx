import React, { useEffect, useState } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

type CursorCostume = 'rainbow' | 'hearts' | 'stars' | 'fire' | 'sparkles';

const costumes = {
  rainbow: (hue: number) => `radial-gradient(circle, hsl(${hue}, 70%, 60%) 0%, transparent 70%)`,
  hearts: () => '❤️',
  stars: () => '⭐',
  fire: () => '🔥',
  sparkles: () => '✨',
};

interface CursorTrailProps {
  costume?: CursorCostume;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({ costume = 'rainbow' }) => {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [currentCostume, setCurrentCostume] = useState<CursorCostume>(costume);

  useEffect(() => {
    let animationId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint: TrailPoint = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now(),
        timestamp: Date.now(),
      };
      
      setTrail(prevTrail => {
        const newTrail = [...prevTrail, newPoint];
        return newTrail.slice(-12);
      });
    };

    const fadeOldPoints = () => {
      const now = Date.now();
      setTrail(prevTrail => 
        prevTrail.filter(point => now - point.timestamp < 800)
      );
      animationId = requestAnimationFrame(fadeOldPoints);
    };

    // Change costume randomly
    const costumeInterval = setInterval(() => {
      const costumeKeys = Object.keys(costumes) as CursorCostume[];
      const randomCostume = costumeKeys[Math.floor(Math.random() * costumeKeys.length)];
      setCurrentCostume(randomCostume);
    }, 10000);

    document.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(fadeOldPoints);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      clearInterval(costumeInterval);
    };
  }, []);

  const isEmoji = currentCostume !== 'rainbow';

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {trail.map((point, index) => {
        const age = (Date.now() - point.timestamp) / 800;
        const opacity = 1 - age;
        const scale = 1 - age * 0.5;
        const hue = (index * 30) % 360;
        
        if (isEmoji) {
          return (
            <div
              key={point.id}
              className="absolute text-xl transition-all duration-100 ease-out"
              style={{
                left: point.x - 12,
                top: point.y - 12,
                opacity: opacity * 0.8,
                transform: `scale(${scale}) rotate(${index * 15}deg)`,
              }}
            >
              {costumes[currentCostume]()}
            </div>
          );
        }

        return (
          <div
            key={point.id}
            className="absolute w-3 h-3 rounded-full transition-all duration-100 ease-out"
            style={{
              left: point.x - 6,
              top: point.y - 6,
              opacity: opacity * 0.6,
              transform: `scale(${scale})`,
              background: costumes.rainbow(hue),
              filter: 'blur(0.5px)',
            }}
          />
        );
      })}
    </div>
  );
};

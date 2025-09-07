import React, { useEffect, useState } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

export const CursorTrail = () => {
  const [trail, setTrail] = useState<TrailPoint[]>([]);

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
        // Keep only the last 12 points for a nice trail effect
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

    document.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(fadeOldPoints);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {trail.map((point, index) => {
        const age = (Date.now() - point.timestamp) / 800; // 0 to 1
        const opacity = 1 - age;
        const scale = 1 - age * 0.5;
        const hue = (index * 30) % 360; // Rainbow effect
        
        return (
          <div
            key={point.id}
            className="absolute w-3 h-3 rounded-full transition-all duration-100 ease-out"
            style={{
              left: point.x - 6,
              top: point.y - 6,
              opacity: opacity * 0.6,
              transform: `scale(${scale})`,
              background: `radial-gradient(circle, hsl(${hue}, 70%, 60%) 0%, transparent 70%)`,
              filter: 'blur(0.5px)',
            }}
          />
        );
      })}
    </div>
  );
};

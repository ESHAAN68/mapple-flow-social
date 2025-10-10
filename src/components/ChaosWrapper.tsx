import { ReactNode, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useChaosStore } from '@/store/chaosStore';

interface ChaosWrapperProps {
  children: ReactNode;
  delay?: number;
}

export const ChaosWrapper = ({ children, delay = 0 }: ChaosWrapperProps) => {
  const { isChaosMode } = useChaosStore();
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const randomRotation = Math.random() * 720 - 360;
  const randomXOffset = Math.random() * 400 - 200;
  const fallDistance = window.innerHeight + 500;

  useEffect(() => {
    if (isChaosMode && !isDragging) {
      controls.start({
        y: fallDistance,
        x: randomXOffset,
        rotate: randomRotation,
        transition: {
          delay: delay,
          duration: 2 + Math.random() * 2,
          ease: [0.34, 1.56, 0.64, 1],
        },
      });
    } else if (!isChaosMode) {
      controls.start({
        y: 0,
        x: 0,
        rotate: 0,
        transition: {
          type: 'spring',
          stiffness: 100,
          damping: 15,
        },
      });
    }
  }, [isChaosMode, controls, delay, fallDistance, randomRotation, randomXOffset, isDragging]);

  if (!isChaosMode) {
    return <>{children}</>;
  }

  return (
    <motion.div
      animate={controls}
      drag={isChaosMode}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      style={{
        cursor: isChaosMode ? 'grab' : 'default',
        position: isChaosMode ? 'relative' : 'static',
        zIndex: isDragging ? 9998 : 'auto',
      }}
      whileDrag={{
        scale: 1.05,
        cursor: 'grabbing',
        zIndex: 9998,
      }}
      className={isChaosMode ? 'select-none' : ''}
    >
      {children}
    </motion.div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuth } from '@/components/auth/AuthProvider';

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F06292', '#AED581', '#FFB74D'
];

export const CursorOverlay: React.FC = () => {
  const { users } = usePresenceStore();
  const { user } = useAuth();

  const getColorForUser = (userId: string) => {
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      <AnimatePresence>
        {users
          .filter(u => u.user_id !== user?.id && u.status === 'active')
          .map((presenceUser) => (
            <motion.div
              key={presenceUser.user_id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: presenceUser.cursor_x,
                y: presenceUser.cursor_y
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute"
              style={{ color: getColorForUser(presenceUser.user_id) }}
            >
              {/* Cursor */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="relative z-10"
              >
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill="currentColor"
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
              
              {/* User label */}
              <div
                className="absolute top-5 left-2 px-2 py-1 text-xs font-medium text-white rounded shadow-lg"
                style={{ backgroundColor: getColorForUser(presenceUser.user_id) }}
              >
                {presenceUser.username}
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};
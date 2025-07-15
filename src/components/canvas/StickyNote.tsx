import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Edit3 } from 'lucide-react';

interface StickyNoteProps {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  content,
  color,
  position,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);

  const handleSave = () => {
    onUpdate(id, text);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setText(content);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: Math.random() * 10 - 5 }}
      whileHover={{ scale: 1.05 }}
      className={`absolute w-48 h-32 p-3 rounded-lg shadow-lg cursor-move ${color} border border-border/20`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          <Edit3 className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className="w-full h-20 bg-transparent resize-none border-none outline-none text-sm"
          autoFocus
          placeholder="Type your note..."
        />
      ) : (
        <div 
          className="text-sm leading-tight cursor-text"
          onClick={() => setIsEditing(true)}
        >
          {content || "Click to edit..."}
        </div>
      )}
    </motion.div>
  );
};
import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText } from 'fabric';
import { useCanvasStore } from '@/store/canvasStore';
import { usePresenceStore } from '@/store/presenceStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Toolbar } from './Toolbar';
import { motion } from 'framer-motion';

interface CanvasProps {
  boardId: string;
}

export const Canvas: React.FC<CanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const { canvas, setCanvas, activeTool, setActiveObject } = useCanvasStore();
  const { user } = useAuth();
  const { updateUser } = usePresenceStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 400, // Account for sidebar and chat
      height: window.innerHeight - 100, // Account for toolbar
      backgroundColor: '#ffffff',
    });

    setFabricCanvas(canvas);
    setCanvas(canvas);

    // Handle object selection
    canvas.on('selection:created', (e) => {
      setActiveObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setActiveObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setActiveObject(null);
    });

    // Handle mouse movement for cursor tracking
    let cursorChannel: any = null;
    
    const initCursorChannel = () => {
      if (cursorChannel) return cursorChannel;
      
      cursorChannel = supabase.channel(`board-cursors:${boardId}`, {
        config: {
          broadcast: { self: false }
        }
      });
      
      cursorChannel.subscribe();
      return cursorChannel;
    };

    canvas.on('mouse:move', (e) => {
      if (!user) return;
      
      const pointer = canvas.getPointer(e.e);
      updateUser({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'User',
        cursor_x: pointer.x,
        cursor_y: pointer.y,
        status: 'active'
      });

      // Broadcast cursor position
      const channel = initCursorChannel();
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          user_id: user.id,
          username: user.email?.split('@')[0] || 'User',
          x: pointer.x,
          y: pointer.y
        }
      });
    });

    // Handle object modifications
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;

      // Broadcast object changes
        supabase.channel(`board:${boardId}`)
        .send({
          type: 'broadcast',
          event: 'object:modified',
          payload: {
            object: obj.toObject(),
            objectId: Math.random().toString()
          }
        });
    });

    return () => {
      canvas.dispose();
    };
  }, [boardId, user, setCanvas, setActiveObject, updateUser]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'pen';
    fabricCanvas.selection = activeTool === 'select';
    
    if (activeTool === 'pen') {
      fabricCanvas.freeDrawingBrush.width = 2;
      fabricCanvas.freeDrawingBrush.color = '#000000';
    }
  }, [activeTool, fabricCanvas]);

  const addRectangle = () => {
    if (!fabricCanvas) return;
    
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    
    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#10B981',
      stroke: '#047857',
      strokeWidth: 2,
    });
    
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
  };

  const addText = () => {
    if (!fabricCanvas) return;
    
    const text = new IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#1F2937',
      fontFamily: 'Inter',
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvas) {
        fabricCanvas.setDimensions({
          width: window.innerWidth - 400,
          height: window.innerHeight - 100,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex-1 bg-background overflow-hidden"
    >
      <Toolbar 
        onAddRectangle={addRectangle}
        onAddCircle={addCircle}
        onAddText={addText}
      />
      <div className="absolute top-16 left-0 right-0 bottom-0">
        <canvas ref={canvasRef} className="border border-border" />
      </div>
    </motion.div>
  );
};
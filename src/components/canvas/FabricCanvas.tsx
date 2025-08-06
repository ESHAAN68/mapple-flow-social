import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Triangle, Polygon, Path, Group } from 'fabric';
import { useCanvasStore } from '@/store/canvasStore';
import { usePresenceStore } from '@/store/presenceStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion } from 'framer-motion';
import { ZoomControls } from './ZoomControls';
import { MiniMap } from './MiniMap';

interface CanvasProps {
  boardId: string;
}

export const Canvas: React.FC<CanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [isDrawing, setIsDrawing] = useState(false);
  const { canvas, setCanvas, activeTool, setActiveTool, setActiveObject, zoom, setZoom } = useCanvasStore();
  const { user } = useAuth();
  const { updateUser } = usePresenceStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 320, // Account for sidebar
      height: window.innerHeight - 64, // Account for header
      backgroundColor: '#fafafa',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: false,
      stateful: true,
      fireRightClick: true,
      fireMiddleClick: true,
      stopContextMenu: true,
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
      // Initialize drawing brush if it doesn't exist
      if (!fabricCanvas.freeDrawingBrush) {
        console.log('Initializing drawing brush...');
      }
      fabricCanvas.freeDrawingBrush.width = 3;
      fabricCanvas.freeDrawingBrush.color = currentColor;
      console.log('Drawing mode enabled with color:', currentColor);
    }
  }, [activeTool, fabricCanvas]);

  const addRectangle = useCallback(() => {
    if (!fabricCanvas) return;
    
    const rect = new Rect({
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
      width: 200,
      height: 100,
      fill: currentColor,
      stroke: currentColor,
      strokeWidth: 0,
      rx: 8,
      ry: 8,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentColor]);

  const addCircle = useCallback(() => {
    if (!fabricCanvas) return;
    
    const circle = new Circle({
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
      radius: 60,
      fill: currentColor,
      stroke: currentColor,
      strokeWidth: 0,
    });
    
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentColor]);

  const addText = useCallback(() => {
    if (!fabricCanvas) return;
    
    const text = new IText('Double click to edit', {
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
      fontSize: 24,
      fill: currentColor,
      fontFamily: 'Inter, sans-serif',
      fontWeight: '500',
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentColor]);

  const addTriangle = useCallback(() => {
    if (!fabricCanvas) return;
    
    const triangle = new Triangle({
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
      width: 120,
      height: 120,
      fill: currentColor,
    });
    
    fabricCanvas.add(triangle);
    fabricCanvas.setActiveObject(triangle);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentColor]);

  const addStar = useCallback(() => {
    if (!fabricCanvas) return;
    
    const starPoints = [];
    const outerRadius = 60;
    const innerRadius = 30;
    const numPoints = 5;
    
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / numPoints;
      starPoints.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    
    const star = new Polygon(starPoints, {
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
      fill: currentColor,
    });
    
    fabricCanvas.add(star);
    fabricCanvas.setActiveObject(star);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentColor]);

  const addStickyNote = useCallback(() => {
    if (!fabricCanvas) return;
    
    const group = new Group([
      new Rect({
        width: 200,
        height: 200,
        fill: '#FEF3C7',
        stroke: '#F59E0B',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      }),
      new IText('Add your note here...', {
        fontSize: 16,
        fill: '#92400E',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        top: 100,
        left: 100,
      })
    ], {
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
    });
    
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const addArrow = useCallback(() => {
    if (!fabricCanvas) return;
    
    const arrow = new Path('M 0 0 L 100 0 L 90 -10 M 100 0 L 90 10', {
      left: Math.random() * 300 + 100,
      top: Math.random() * 200 + 100,
      stroke: currentColor,
      strokeWidth: 3,
      fill: '',
    });
    
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentColor]);

  // Enhanced tool handling
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleToolAction = () => {
      switch (activeTool) {
        case 'rectangle':
          addRectangle();
          break;
        case 'circle':
          addCircle();
          break;
        case 'text':
          addText();
          break;
        case 'triangle':
          addTriangle();
          break;
        case 'star':
          addStar();
          break;
        case 'sticky':
          addStickyNote();
          break;
        case 'arrow':
          addArrow();
          break;
      }
    };

    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject) {
            fabricCanvas.remove(activeObject);
            fabricCanvas.renderAll();
          }
          break;
        case 'v':
        case 'V':
          if (!e.ctrlKey && !e.metaKey) {
            setActiveTool('select');
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            setActiveTool('rectangle');
            handleToolAction();
          }
          break;
        case 'c':
        case 'C':
          if (!e.ctrlKey && !e.metaKey) {
            setActiveTool('circle');
            handleToolAction();
          }
          break;
        case 't':
        case 'T':
          if (!e.ctrlKey && !e.metaKey) {
            setActiveTool('text');
            handleToolAction();
          }
          break;
        case 'p':
        case 'P':
          if (!e.ctrlKey && !e.metaKey) {
            setActiveTool('pen');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, activeTool, addRectangle, addCircle, addText, addTriangle, addStar, addStickyNote, addArrow]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvas) {
        fabricCanvas.setDimensions({
          width: window.innerWidth - 320,
          height: window.innerHeight - 64,
        });
        fabricCanvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas]);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    if (!fabricCanvas) return;
    
    const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  }, [fabricCanvas, zoom, setZoom]);

  const resetZoom = useCallback(() => {
    if (!fabricCanvas) return;
    
    setZoom(1);
    fabricCanvas.setZoom(1);
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.renderAll();
  }, [fabricCanvas, setZoom]);

  const fitToScreen = useCallback(() => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length === 0) return;
    
    const group = new Group(objects);
    const groupBounds = group.getBoundingRect();
    
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    
    const scaleX = (canvasWidth * 0.8) / groupBounds.width;
    const scaleY = (canvasHeight * 0.8) / groupBounds.height;
    const scale = Math.min(scaleX, scaleY);
    
    setZoom(scale);
    fabricCanvas.setZoom(scale);
    
    const centerX = (canvasWidth - groupBounds.width * scale) / 2;
    const centerY = (canvasHeight - groupBounds.height * scale) / 2;
    
    fabricCanvas.setViewportTransform([
      scale, 0, 0, scale,
      centerX - groupBounds.left * scale,
      centerY - groupBounds.top * scale
    ]);
    
    fabricCanvas.renderAll();
  }, [fabricCanvas, setZoom]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex-1 bg-background overflow-hidden"
    >
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
        onResetZoom={resetZoom}
        onFitToScreen={fitToScreen}
      />
      
      {/* Mini Map */}
      <MiniMap canvas={fabricCanvas} />
      
      {/* Color Picker (Floating) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-md border border-border rounded-lg p-2 shadow-lg"
      >
        <div className="flex gap-2">
          {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'].map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                currentColor === color ? 'border-foreground scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCanvasStore } from '@/store/canvasStore';
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Pen,
  ZoomIn,
  ZoomOut,
  Download,
  Save
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ToolbarProps {
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddText: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle,
  onAddCircle,
  onAddText,
}) => {
  const { activeTool, setActiveTool, canvas, zoom, setZoom } = useCanvasStore();

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'pen', icon: Pen, label: 'Draw' },
  ] as const;

  const handleToolClick = (toolId: typeof tools[number]['id']) => {
    setActiveTool(toolId);
    if (toolId === 'rectangle') onAddRectangle();
    if (toolId === 'circle') onAddCircle();
    if (toolId === 'text') onAddText();
  };

  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleExport = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });
    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = dataURL;
    link.click();
  };

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-card/80 backdrop-blur-md border border-border rounded-lg p-2"
    >
      <div className="flex items-center gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleToolClick(tool.id)}
              className="relative"
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{tool.label}</span>
            </Button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="ghost" size="sm">
          <Save className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};
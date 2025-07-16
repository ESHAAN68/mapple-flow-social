import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-md border border-border rounded-lg p-2 shadow-lg"
    >
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onResetZoom}
          className="text-xs px-2"
        >
          {Math.round(zoom * 100)}%
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="h-px bg-border my-1" />
        
        <Button variant="ghost" size="sm" onClick={onFitToScreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onResetZoom}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};
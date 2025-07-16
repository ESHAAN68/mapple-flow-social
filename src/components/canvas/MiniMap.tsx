import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas as FabricCanvas } from 'fabric';

interface MiniMapProps {
  canvas: FabricCanvas | null;
}

export const MiniMap: React.FC<MiniMapProps> = ({ canvas }) => {
  const miniMapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas || !miniMapRef.current) return;

    const miniMapCanvas = new FabricCanvas(miniMapRef.current, {
      width: 200,
      height: 150,
      backgroundColor: '#f8f9fa',
      selection: false,
      renderOnAddRemove: false,
    });

    const updateMiniMap = () => {
      miniMapCanvas.clear();
      
      // Clone objects from main canvas
      const objects = canvas.getObjects();
      const scale = 0.2; // Scale down for mini map
      
      objects.forEach(async (obj) => {
        try {
          const clonedObj = await obj.clone();
          clonedObj.set({
            left: (obj.left || 0) * scale,
            top: (obj.top || 0) * scale,
            scaleX: (obj.scaleX || 1) * scale,
            scaleY: (obj.scaleY || 1) * scale,
            selectable: false,
            evented: false,
          });
          miniMapCanvas.add(clonedObj);
        } catch (error) {
          console.warn('Failed to clone object for minimap:', error);
        }
      });
      
      miniMapCanvas.renderAll();
    };

    // Update mini map when main canvas changes
    canvas.on('after:render', updateMiniMap);
    canvas.on('object:added', updateMiniMap);
    canvas.on('object:removed', updateMiniMap);
    canvas.on('object:modified', updateMiniMap);

    updateMiniMap();

    return () => {
      canvas.off('after:render', updateMiniMap);
      canvas.off('object:added', updateMiniMap);
      canvas.off('object:removed', updateMiniMap);
      canvas.off('object:modified', updateMiniMap);
      miniMapCanvas.dispose();
    };
  }, [canvas]);

  if (!canvas) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-4 right-4 bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg"
    >
      <div className="text-xs font-medium text-muted-foreground mb-2">Mini Map</div>
      <canvas 
        ref={miniMapRef} 
        className="border border-border rounded" 
        style={{ width: 200, height: 150 }}
      />
    </motion.div>
  );
};
import { create } from 'zustand';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';

interface CanvasState {
  canvas: FabricCanvas | null;
  activeObject: FabricObject | null;
  activeTool: 'select' | 'rectangle' | 'circle' | 'text' | 'pen' | 'triangle' | 'star' | 'sticky' | 'arrow' | 'highlighter' | 'comment' | 'image';
  isDrawing: boolean;
  zoom: number;
  setCanvas: (canvas: FabricCanvas) => void;
  setActiveObject: (object: FabricObject | null) => void;
  setActiveTool: (tool: 'select' | 'rectangle' | 'circle' | 'text' | 'pen' | 'triangle' | 'star' | 'sticky' | 'arrow' | 'highlighter' | 'comment' | 'image') => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setZoom: (zoom: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  canvas: null,
  activeObject: null,
  activeTool: 'select',
  isDrawing: false,
  zoom: 1,
  setCanvas: (canvas) => set({ canvas }),
  setActiveObject: (activeObject) => set({ activeObject }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setZoom: (zoom) => set({ zoom }),
}));
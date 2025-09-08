import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Rect, Circle, Triangle, IText, Group } from 'fabric';
import { 
  MousePointer2, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Pen,
  StickyNote,
  ArrowRight,
  Image,
  Star,
  Triangle as TriangleIcon,
  Heart,
  MessageSquare,
  Upload,
  Palette,
  Layers,
  Search,
  Plus,
  Minus
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';

interface BoardSidebarProps {
  boardId: string;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({ boardId }) => {
  const { activeTool, setActiveTool, canvas } = useCanvasStore();
  const [searchTerm, setSearchTerm] = useState('');

  const addShape = (toolId: string) => {
    if (!canvas) return;
    
    setActiveTool(toolId as any);
    
    // Immediately create the shape when clicked
    switch (toolId) {
      case 'rectangle':
        const rect = new Rect({
          left: Math.random() * 300 + 100,
          top: Math.random() * 200 + 100,
          width: 200,
          height: 100,
          fill: '#3B82F6',
          stroke: '#3B82F6',
          strokeWidth: 0,
          rx: 8,
          ry: 8,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
        break;
        
      case 'circle':
        const circle = new Circle({
          left: Math.random() * 300 + 100,
          top: Math.random() * 200 + 100,
          radius: 60,
          fill: '#3B82F6',
          stroke: '#3B82F6',
          strokeWidth: 0,
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.renderAll();
        break;
        
      case 'triangle':
        const triangle = new Triangle({
          left: Math.random() * 300 + 100,
          top: Math.random() * 200 + 100,
          width: 120,
          height: 120,
          fill: '#3B82F6',
        });
        canvas.add(triangle);
        canvas.setActiveObject(triangle);
        canvas.renderAll();
        break;
        
      case 'text':
        const text = new IText('Double click to edit', {
          left: Math.random() * 300 + 100,
          top: Math.random() * 200 + 100,
          fontSize: 24,
          fill: '#3B82F6',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        break;
        
      case 'sticky':
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
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        break;
        
      case 'pen':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = 3;
          canvas.freeDrawingBrush.color = '#3B82F6';
        }
        break;
        
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;
    }
  };

  const toolCategories = [
    {
      title: 'Selection',
      tools: [
        { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
      ]
    },
    {
      title: 'Drawing',
      tools: [
        { id: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
        { id: 'highlighter', icon: Pen, label: 'Highlighter', shortcut: 'H' },
      ]
    },
    {
      title: 'Shapes',
      tools: [
        { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
        { id: 'circle', icon: CircleIcon, label: 'Circle', shortcut: 'C' },
        { id: 'triangle', icon: TriangleIcon, label: 'Triangle', shortcut: 'T' },
        { id: 'star', icon: Star, label: 'Star', shortcut: 'S' },
        { id: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
      ]
    },
    {
      title: 'Content',
      tools: [
        { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
        { id: 'sticky', icon: StickyNote, label: 'Sticky Note', shortcut: 'N' },
        { id: 'comment', icon: MessageSquare, label: 'Comment', shortcut: 'M' },
        { id: 'image', icon: Image, label: 'Image', shortcut: 'I' },
      ]
    }
  ];

  const templates = [
    { name: 'Flowchart', icon: '🔄' },
    { name: 'Mind Map', icon: '🧠' },
    { name: 'Wireframe', icon: '📱' },
    { name: 'User Story Map', icon: '👤' },
    { name: 'Kanban Board', icon: '📋' },
    { name: 'Retrospective', icon: '🔄' },
  ];

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F06292', '#AED581', '#FFB74D',
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'
  ];

  return (
    <motion.div 
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 bg-background border-r border-border flex flex-col h-full"
    >
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools and templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Tools */}
          {toolCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {category.title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {category.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant={activeTool === tool.id ? "default" : "ghost"}
                      className="h-20 flex flex-col items-center justify-center gap-2 relative group"
                      onClick={() => addShape(tool.id)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs">{tool.label}</span>
                      <span className="absolute top-1 right-1 text-xs opacity-50">
                        {tool.shortcut}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}

          <Separator />

          {/* Colors */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Colors
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded-md border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    // Handle color selection
                  }}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Templates */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Quick Templates
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.name}
                  variant="ghost"
                  className="w-full justify-start h-12"
                >
                  <span className="text-lg mr-3">{template.icon}</span>
                  <span className="text-sm">{template.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Layers */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Layers
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm">Background</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm">Main Layer</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="ghost" className="w-full h-8">
                <Plus className="h-4 w-4 mr-2" />
                Add Layer
              </Button>
            </div>
          </div>

          {/* Upload */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Import
            </h3>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
};
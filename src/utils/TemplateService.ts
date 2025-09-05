export interface TemplateCanvasData {
  objects: Array<{
    id: string;
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: string;
    backgroundColor?: string;
    rx?: number;
    ry?: number;
  }>;
  backgroundImage?: string;
  backgroundColor?: string;
}

export class TemplateService {
  static generateCanvasData(templateId: string): TemplateCanvasData {
    switch (templateId) {
      case 'business-model-canvas':
        return this.generateBusinessModelCanvas();
      case 'lean-canvas':
        return this.generateLeanCanvas();
      case 'design-thinking-process':
        return this.generateDesignThinkingProcess();
      case 'customer-journey-map':
        return this.generateCustomerJourneyMap();
      case 'swot-analysis':
        return this.generateSWOTAnalysis();
      case 'empathy-map':
        return this.generateEmpathyMap();
      case 'scrum-retrospective':
        return this.generateScrumRetrospective();
      case 'okr-template':
        return this.generateOKRTemplate();
      case 'user-story-mapping':
        return this.generateUserStoryMapping();
      case 'value-proposition-canvas':
        return this.generateValuePropositionCanvas();
      case 'impact-mapping':
        return this.generateImpactMapping();
      case 'kanban-board':
        return this.generateKanbanBoard();
      default:
        return { objects: [] };
    }
  }

  private static generateBusinessModelCanvas(): TemplateCanvasData {
    const sections = [
      { title: 'Key Partners', x: 50, y: 100, width: 180, height: 200 },
      { title: 'Key Activities', x: 250, y: 100, width: 180, height: 95 },
      { title: 'Key Resources', x: 250, y: 215, width: 180, height: 85 },
      { title: 'Value Propositions', x: 450, y: 100, width: 200, height: 200 },
      { title: 'Customer Relationships', x: 670, y: 100, width: 180, height: 95 },
      { title: 'Channels', x: 670, y: 215, width: 180, height: 85 },
      { title: 'Customer Segments', x: 870, y: 100, width: 180, height: 200 },
      { title: 'Cost Structure', x: 50, y: 320, width: 500, height: 100 },
      { title: 'Revenue Streams', x: 570, y: 320, width: 480, height: 100 }
    ];

    const objects = [];
    
    sections.forEach((section, index) => {
      // Background rectangle
      objects.push({
        id: `section-bg-${index}`,
        type: 'rect',
        left: section.x,
        top: section.y,
        width: section.width,
        height: section.height,
        fill: '#f8fafc',
        stroke: '#e2e8f0',
        rx: 8,
        ry: 8
      });

      // Title text
      objects.push({
        id: `section-title-${index}`,
        type: 'text',
        left: section.x + section.width / 2,
        top: section.y + 20,
        width: section.width - 20,
        height: 30,
        text: section.title,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#1e293b'
      });
    });

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateLeanCanvas(): TemplateCanvasData {
    const sections = [
      { title: 'Problem', x: 50, y: 100, width: 180, height: 150 },
      { title: 'Solution', x: 250, y: 100, width: 180, height: 150 },
      { title: 'Unique Value Proposition', x: 450, y: 100, width: 200, height: 150 },
      { title: 'Unfair Advantage', x: 670, y: 100, width: 180, height: 150 },
      { title: 'Customer Segments', x: 870, y: 100, width: 180, height: 150 },
      { title: 'Key Metrics', x: 50, y: 270, width: 180, height: 120 },
      { title: 'Channels', x: 250, y: 270, width: 180, height: 120 },
      { title: 'Cost Structure', x: 450, y: 270, width: 200, height: 120 },
      { title: 'Revenue Streams', x: 670, y: 270, width: 380, height: 120 }
    ];

    const objects = [];
    
    sections.forEach((section, index) => {
      objects.push({
        id: `lean-section-bg-${index}`,
        type: 'rect',
        left: section.x,
        top: section.y,
        width: section.width,
        height: section.height,
        fill: '#fef3c7',
        stroke: '#f59e0b',
        rx: 8,
        ry: 8
      });

      objects.push({
        id: `lean-section-title-${index}`,
        type: 'text',
        left: section.x + section.width / 2,
        top: section.y + 20,
        width: section.width - 20,
        height: 30,
        text: section.title,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#92400e'
      });
    });

    return { objects, backgroundColor: '#fffbeb' };
  }

  private static generateDesignThinkingProcess(): TemplateCanvasData {
    const stages = [
      { title: 'EMPATHIZE', subtitle: 'Understand users', x: 50, y: 150, color: '#ef4444' },
      { title: 'DEFINE', subtitle: 'Frame problems', x: 250, y: 150, color: '#f97316' },
      { title: 'IDEATE', subtitle: 'Generate ideas', x: 450, y: 150, color: '#eab308' },
      { title: 'PROTOTYPE', subtitle: 'Build solutions', x: 650, y: 150, color: '#22c55e' },
      { title: 'TEST', subtitle: 'Validate ideas', x: 850, y: 150, color: '#3b82f6' }
    ];

    const objects = [];

    stages.forEach((stage, index) => {
      // Stage circle
      objects.push({
        id: `stage-circle-${index}`,
        type: 'circle',
        left: stage.x + 75,
        top: stage.y + 75,
        width: 150,
        height: 150,
        fill: stage.color,
        stroke: '#ffffff'
      });

      // Stage title
      objects.push({
        id: `stage-title-${index}`,
        type: 'text',
        left: stage.x + 75,
        top: stage.y + 65,
        width: 150,
        height: 30,
        text: stage.title,
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#ffffff'
      });

      // Stage subtitle
      objects.push({
        id: `stage-subtitle-${index}`,
        type: 'text',
        left: stage.x + 75,
        top: stage.y + 95,
        width: 150,
        height: 20,
        text: stage.subtitle,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#ffffff'
      });

      // Arrow to next stage
      if (index < stages.length - 1) {
        objects.push({
          id: `arrow-${index}`,
          type: 'text',
          left: stage.x + 180,
          top: stage.y + 75,
          width: 50,
          height: 30,
          text: '→',
          fontSize: 24,
          textAlign: 'center',
          fill: '#6b7280'
        });
      }
    });

    return { objects, backgroundColor: '#f9fafb' };
  }

  private static generateSWOTAnalysis(): TemplateCanvasData {
    const quadrants = [
      { title: 'STRENGTHS', subtitle: 'Internal Positive', x: 100, y: 150, color: '#22c55e' },
      { title: 'WEAKNESSES', subtitle: 'Internal Negative', x: 500, y: 150, color: '#ef4444' },
      { title: 'OPPORTUNITIES', subtitle: 'External Positive', x: 100, y: 350, color: '#3b82f6' },
      { title: 'THREATS', subtitle: 'External Negative', x: 500, y: 350, color: '#f59e0b' }
    ];

    const objects = [];

    // SWOT title
    objects.push({
      id: 'swot-title',
      type: 'text',
      left: 400,
      top: 50,
      width: 200,
      height: 50,
      text: 'SWOT ANALYSIS',
      fontSize: 24,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1f2937'
    });

    quadrants.forEach((quadrant, index) => {
      objects.push({
        id: `swot-quadrant-${index}`,
        type: 'rect',
        left: quadrant.x,
        top: quadrant.y,
        width: 300,
        height: 180,
        fill: quadrant.color + '20',
        stroke: quadrant.color,
        rx: 12,
        ry: 12
      });

      objects.push({
        id: `swot-title-${index}`,
        type: 'text',
        left: quadrant.x + 150,
        top: quadrant.y + 30,
        width: 280,
        height: 30,
        text: quadrant.title,
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: quadrant.color
      });

      objects.push({
        id: `swot-subtitle-${index}`,
        type: 'text',
        left: quadrant.x + 150,
        top: quadrant.y + 55,
        width: 280,
        height: 20,
        text: quadrant.subtitle,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#6b7280'
      });
    });

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateEmpathyMap(): TemplateCanvasData {
    const sections = [
      { title: 'THINKS & FEELS', x: 300, y: 50, width: 200, height: 150, color: '#ec4899' },
      { title: 'SEES', x: 50, y: 150, width: 180, height: 200, color: '#3b82f6' },
      { title: 'SAYS & DOES', x: 300, y: 250, width: 200, height: 150, color: '#10b981' },
      { title: 'HEARS', x: 570, y: 150, width: 180, height: 200, color: '#f59e0b' }
    ];

    const objects = [];

    // Central user circle
    objects.push({
      id: 'user-circle',
      type: 'circle',
      left: 375,
      top: 175,
      width: 50,
      height: 50,
      fill: '#8b5cf6',
      stroke: '#ffffff'
    });

    objects.push({
      id: 'user-text',
      type: 'text',
      left: 375,
      top: 185,
      width: 50,
      height: 20,
      text: 'USER',
      fontSize: 10,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#ffffff'
    });

    sections.forEach((section, index) => {
      objects.push({
        id: `empathy-section-${index}`,
        type: 'rect',
        left: section.x,
        top: section.y,
        width: section.width,
        height: section.height,
        fill: section.color + '20',
        stroke: section.color,
        rx: 8,
        ry: 8
      });

      objects.push({
        id: `empathy-title-${index}`,
        type: 'text',
        left: section.x + section.width / 2,
        top: section.y + 20,
        width: section.width - 20,
        height: 25,
        text: section.title,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: section.color
      });
    });

    return { objects, backgroundColor: '#f8fafc' };
  }

  private static generateScrumRetrospective(): TemplateCanvasData {
    const columns = [
      { title: 'What Went Well?', x: 100, y: 150, color: '#22c55e' },
      { title: 'What Could Be Improved?', x: 400, y: 150, color: '#f59e0b' },
      { title: 'Action Items', x: 700, y: 150, color: '#3b82f6' }
    ];

    const objects = [];

    // Title
    objects.push({
      id: 'retro-title',
      type: 'text',
      left: 500,
      top: 50,
      width: 300,
      height: 50,
      text: 'Sprint Retrospective',
      fontSize: 24,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1f2937'
    });

    columns.forEach((column, index) => {
      objects.push({
        id: `retro-column-${index}`,
        type: 'rect',
        left: column.x,
        top: column.y,
        width: 250,
        height: 300,
        fill: column.color + '10',
        stroke: column.color,
        rx: 8,
        ry: 8
      });

      objects.push({
        id: `retro-column-title-${index}`,
        type: 'text',
        left: column.x + 125,
        top: column.y + 30,
        width: 230,
        height: 30,
        text: column.title,
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: column.color
      });
    });

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateOKRTemplate(): TemplateCanvasData {
    const objects = [];

    // Title
    objects.push({
      id: 'okr-title',
      type: 'text',
      left: 400,
      top: 50,
      width: 200,
      height: 50,
      text: 'OKRs - Q4 2024',
      fontSize: 24,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1f2937'
    });

    // Objective sections
    for (let i = 0; i < 3; i++) {
      const y = 150 + (i * 180);
      
      // Objective box
      objects.push({
        id: `objective-${i}`,
        type: 'rect',
        left: 100,
        top: y,
        width: 800,
        height: 150,
        fill: '#dbeafe',
        stroke: '#3b82f6',
        rx: 8,
        ry: 8
      });

      objects.push({
        id: `objective-title-${i}`,
        type: 'text',
        left: 120,
        top: y + 20,
        width: 760,
        height: 30,
        text: `Objective ${i + 1}: [Enter your objective here]`,
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        fill: '#1e40af'
      });

      // Key Results
      for (let j = 0; j < 3; j++) {
        objects.push({
          id: `kr-${i}-${j}`,
          type: 'text',
          left: 140,
          top: y + 60 + (j * 25),
          width: 720,
          height: 20,
          text: `• Key Result ${j + 1}: [Measurable outcome]`,
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fill: '#374151'
        });
      }
    }

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateCustomerJourneyMap(): TemplateCanvasData {
    const stages = ['Awareness', 'Consideration', 'Purchase', 'Onboarding', 'Support', 'Advocacy'];
    const rows = ['Touchpoints', 'Customer Actions', 'Emotions', 'Pain Points', 'Opportunities'];
    
    const objects = [];

    // Title
    objects.push({
      id: 'journey-title',
      type: 'text',
      left: 500,
      top: 30,
      width: 300,
      height: 40,
      text: 'Customer Journey Map',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1f2937'
    });

    // Create grid
    stages.forEach((stage, colIndex) => {
      // Stage header
      objects.push({
        id: `stage-header-${colIndex}`,
        type: 'rect',
        left: 150 + (colIndex * 130),
        top: 80,
        width: 120,
        height: 40,
        fill: '#3b82f6',
        rx: 4,
        ry: 4
      });

      objects.push({
        id: `stage-title-${colIndex}`,
        type: 'text',
        left: 150 + (colIndex * 130) + 60,
        top: 95,
        width: 100,
        height: 20,
        text: stage,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#ffffff'
      });

      // Grid cells
      rows.forEach((row, rowIndex) => {
        objects.push({
          id: `cell-${colIndex}-${rowIndex}`,
          type: 'rect',
          left: 150 + (colIndex * 130),
          top: 130 + (rowIndex * 60),
          width: 120,
          height: 50,
          fill: '#f8fafc',
          stroke: '#e2e8f0',
          rx: 4,
          ry: 4
        });
      });
    });

    // Row headers
    rows.forEach((row, rowIndex) => {
      objects.push({
        id: `row-header-${rowIndex}`,
        type: 'rect',
        left: 20,
        top: 130 + (rowIndex * 60),
        width: 120,
        height: 50,
        fill: '#f1f5f9',
        stroke: '#cbd5e1',
        rx: 4,
        ry: 4
      });

      objects.push({
        id: `row-title-${rowIndex}`,
        type: 'text',
        left: 80,
        top: 145 + (rowIndex * 60),
        width: 100,
        height: 20,
        text: row,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#475569'
      });
    });

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateUserStoryMapping(): TemplateCanvasData {
    const objects = [];

    // Title
    objects.push({
      id: 'story-map-title',
      type: 'text',
      left: 400,
      top: 30,
      width: 300,
      height: 40,
      text: 'User Story Map',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1f2937'
    });

    // Epic level
    objects.push({
      id: 'epic-label',
      type: 'text',
      left: 50,
      top: 100,
      width: 100,
      height: 30,
      text: 'User Journey',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif',
      fill: '#6b7280'
    });

    // Epics
    for (let i = 0; i < 5; i++) {
      objects.push({
        id: `epic-${i}`,
        type: 'rect',
        left: 180 + (i * 150),
        top: 90,
        width: 130,
        height: 50,
        fill: '#fef3c7',
        stroke: '#f59e0b',
        rx: 6,
        ry: 6
      });

      objects.push({
        id: `epic-text-${i}`,
        type: 'text',
        left: 180 + (i * 150) + 65,
        top: 110,
        width: 110,
        height: 20,
        text: `Epic ${i + 1}`,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#92400e'
      });

      // User stories under each epic
      for (let j = 0; j < 4; j++) {
        objects.push({
          id: `story-${i}-${j}`,
          type: 'rect',
          left: 180 + (i * 150),
          top: 160 + (j * 60),
          width: 130,
          height: 40,
          fill: '#dbeafe',
          stroke: '#3b82f6',
          rx: 4,
          ry: 4
        });

        objects.push({
          id: `story-text-${i}-${j}`,
          type: 'text',
          left: 180 + (i * 150) + 65,
          top: 175 + (j * 60),
          width: 110,
          height: 15,
          text: `Story ${j + 1}`,
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          fill: '#1e40af'
        });
      }
    }

    // Release lines
    objects.push({
      id: 'release-1-line',
      type: 'line',
      left: 50,
      top: 280,
      width: 900,
      height: 2,
      stroke: '#ef4444'
    });

    objects.push({
      id: 'release-1-label',
      type: 'text',
      left: 50,
      top: 285,
      width: 100,
      height: 20,
      text: 'Release 1',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
      fill: '#ef4444'
    });

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateValuePropositionCanvas(): TemplateCanvasData {
    const objects = [];

    // Customer Profile (right circle)
    objects.push({
      id: 'customer-circle',
      type: 'circle',
      left: 550,
      top: 150,
      width: 300,
      height: 300,
      fill: '#fef3c7',
      stroke: '#f59e0b'
    });

    objects.push({
      id: 'customer-title',
      type: 'text',
      left: 700,
      top: 200,
      width: 100,
      height: 30,
      text: 'Customer',
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#92400e'
    });

    // Value Map (left square)
    objects.push({
      id: 'value-square',
      type: 'rect',
      left: 150,
      top: 150,
      width: 300,
      height: 300,
      fill: '#dbeafe',
      stroke: '#3b82f6',
      rx: 8,
      ry: 8
    });

    objects.push({
      id: 'value-title',
      type: 'text',
      left: 300,
      top: 200,
      width: 100,
      height: 30,
      text: 'Value Map',
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1e40af'
    });

    // Customer segments
    const customerSections = [
      { text: 'Customer Jobs', x: 630, y: 180 },
      { text: 'Pains', x: 580, y: 280 },
      { text: 'Gains', x: 720, y: 280 }
    ];

    customerSections.forEach((section, index) => {
      objects.push({
        id: `customer-section-${index}`,
        type: 'text',
        left: section.x,
        top: section.y,
        width: 80,
        height: 20,
        text: section.text,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#92400e'
      });
    });

    // Value sections
    const valueSections = [
      { text: 'Products & Services', x: 270, y: 180 },
      { text: 'Pain Relievers', x: 200, y: 280 },
      { text: 'Gain Creators', x: 350, y: 280 }
    ];

    valueSections.forEach((section, index) => {
      objects.push({
        id: `value-section-${index}`,
        type: 'text',
        left: section.x,
        top: section.y,
        width: 80,
        height: 20,
        text: section.text,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#1e40af'
      });
    });

    return { objects, backgroundColor: '#ffffff' };
  }

  private static generateImpactMapping(): TemplateCanvasData {
    const objects = [];

    // Goal (center)
    objects.push({
      id: 'goal-center',
      type: 'rect',
      left: 400,
      top: 200,
      width: 200,
      height: 100,
      fill: '#fbbf24',
      stroke: '#f59e0b',
      rx: 8,
      ry: 8
    });

    objects.push({
      id: 'goal-text',
      type: 'text',
      left: 500,
      top: 240,
      width: 180,
      height: 30,
      text: 'GOAL',
      fontSize: 18,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#92400e'
    });

    // Actors (left)
    const actors = ['Actor 1', 'Actor 2', 'Actor 3'];
    actors.forEach((actor, index) => {
      objects.push({
        id: `actor-${index}`,
        type: 'rect',
        left: 100,
        top: 150 + (index * 80),
        width: 120,
        height: 60,
        fill: '#a7f3d0',
        stroke: '#10b981',
        rx: 6,
        ry: 6
      });

      objects.push({
        id: `actor-text-${index}`,
        type: 'text',
        left: 160,
        top: 175 + (index * 80),
        width: 100,
        height: 20,
        text: actor,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#065f46'
      });

      // Connection line
      objects.push({
        id: `actor-line-${index}`,
        type: 'line',
        left: 220,
        top: 180 + (index * 80),
        width: 180,
        height: 2,
        stroke: '#6b7280'
      });
    });

    // Deliverables (right)
    const deliverables = ['Feature A', 'Feature B', 'Feature C'];
    deliverables.forEach((deliverable, index) => {
      objects.push({
        id: `deliverable-${index}`,
        type: 'rect',
        left: 780,
        top: 150 + (index * 80),
        width: 120,
        height: 60,
        fill: '#ddd6fe',
        stroke: '#8b5cf6',
        rx: 6,
        ry: 6
      });

      objects.push({
        id: `deliverable-text-${index}`,
        type: 'text',
        left: 840,
        top: 175 + (index * 80),
        width: 100,
        height: 20,
        text: deliverable,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#5b21b6'
      });

      // Connection line
      objects.push({
        id: `deliverable-line-${index}`,
        type: 'line',
        left: 600,
        top: 180 + (index * 80),
        width: 180,
        height: 2,
        stroke: '#6b7280'
      });
    });

    return { objects, backgroundColor: '#f9fafb' };
  }

  private static generateKanbanBoard(): TemplateCanvasData {
    const columns = [
      { title: 'Backlog', x: 100, color: '#6b7280' },
      { title: 'To Do', x: 300, color: '#ef4444' },
      { title: 'In Progress', x: 500, color: '#f59e0b' },
      { title: 'Review', x: 700, color: '#3b82f6' },
      { title: 'Done', x: 900, color: '#10b981' }
    ];

    const objects = [];

    // Title  
    objects.push({
      id: 'kanban-title',
      type: 'text',
      left: 500,
      top: 50,
      width: 200,
      height: 40,
      text: 'Kanban Board',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      fill: '#1f2937'
    });

    columns.forEach((column, colIndex) => {
      // Column header
      objects.push({
        id: `kanban-column-${colIndex}`,
        type: 'rect',
        left: column.x,
        top: 120,
        width: 180,
        height: 60,
        fill: column.color,
        rx: 8,
        ry: 8
      });

      objects.push({
        id: `kanban-column-title-${colIndex}`,
        type: 'text',
        left: column.x + 90,
        top: 145,
        width: 160,
        height: 25,
        text: column.title,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        fill: '#ffffff'
      });

      // Column background
      objects.push({
        id: `kanban-column-bg-${colIndex}`,
        type: 'rect',
        left: column.x,
        top: 190,
        width: 180,
        height: 400,
        fill: '#f8fafc',
        stroke: '#e2e8f0',
        rx: 8,
        ry: 8
      });

      // Sample cards
      if (colIndex < 3) { // Only add cards to first 3 columns
        for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
          objects.push({
            id: `kanban-card-${colIndex}-${cardIndex}`,
            type: 'rect',
            left: column.x + 10,
            top: 210 + (cardIndex * 80),
            width: 160,
            height: 60,
            fill: '#ffffff',
            stroke: column.color,
            rx: 6,
            ry: 6
          });

          objects.push({
            id: `kanban-card-text-${colIndex}-${cardIndex}`,
            type: 'text',
            left: column.x + 90,
            top: 235 + (cardIndex * 80),
            width: 140,
            height: 20,
            text: `Task ${cardIndex + 1}`,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            fill: '#374151'
          });
        }
      }
    });

    return { objects, backgroundColor: '#ffffff' };
  }
}
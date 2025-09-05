import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, Search, Filter, Download, Eye, Heart, 
  Bookmark, Share2, Crown, TrendingUp, Clock,
  Palette, Layout, Code, Presentation, FileText,
  BarChart3, Users, Sparkles, Zap, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  created_at: string;
  author: {
    username: string;
    avatar_url?: string;
  };
  downloads: number;
  likes: number;
  views: number;
  rating: number;
  is_featured: boolean;
  is_premium: boolean;
  tags: string[];
}

const categories = [
  { id: 'all', name: 'All Templates', icon: Layout },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'business', name: 'Business', icon: Presentation },
  { id: 'education', name: 'Education', icon: FileText },
  { id: 'development', name: 'Development', icon: Code },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 }
];

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    loadTemplates();
    setupRealtimeSubscription();
  }, []);

  const loadTemplates = async () => {
    // Real business framework templates inspired by Miro and industry standards
    const realTemplates: Template[] = [
      {
        id: 'business-model-canvas',
        title: 'Business Model Canvas',
        description: 'The strategic management template by Alexander Osterwalder. Map your value proposition, key activities, customer segments, and revenue streams on one page.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=250&fit=crop',
        created_at: new Date().toISOString(),
        author: { username: 'strategyzer', avatar_url: '' },
        downloads: 15420,
        likes: 1256,
        views: 28950,
        rating: 4.9,
        is_featured: true,
        is_premium: false,
        tags: ['strategy', 'business-model', 'canvas', 'startup', 'value-proposition']
      },
      {
        id: 'lean-canvas',
        title: 'Lean Canvas',
        description: 'Ash Maurya\'s adaptation of the Business Model Canvas for startups. Focus on problems, solutions, key metrics, and unfair advantages.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        author: { username: 'leanstack', avatar_url: '' },
        downloads: 12847,
        likes: 987,
        views: 23456,
        rating: 4.8,
        is_featured: true,
        is_premium: false,
        tags: ['lean-startup', 'mvp', 'problem-solution-fit', 'metrics']
      },
      {
        id: 'design-thinking-process',
        title: 'Design Thinking Process',
        description: 'The complete 5-stage design thinking framework: Empathize, Define, Ideate, Prototype, and Test. Perfect for human-centered innovation.',
        category: 'design',
        thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        author: { username: 'ideo_method', avatar_url: '' },
        downloads: 9876,
        likes: 756,
        views: 18932,
        rating: 4.7,
        is_featured: true,
        is_premium: false,
        tags: ['design-thinking', 'empathy', 'ideation', 'prototype', 'user-centered']
      },
      {
        id: 'customer-journey-map',
        title: 'Customer Journey Map',
        description: 'Visualize every touchpoint in your customer\'s experience. Identify pain points, emotions, and opportunities for improvement.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        author: { username: 'ux_research', avatar_url: '' },
        downloads: 8743,
        likes: 623,
        views: 16789,
        rating: 4.6,
        is_featured: false,
        is_premium: false,
        tags: ['customer-experience', 'journey-mapping', 'touchpoints', 'ux']
      },
      {
        id: 'swot-analysis',
        title: 'SWOT Analysis',
        description: 'Strategic planning tool to evaluate Strengths, Weaknesses, Opportunities, and Threats. Essential for business strategy development.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        author: { username: 'strategy_pro', avatar_url: '' },
        downloads: 11234,
        likes: 834,
        views: 21456,
        rating: 4.5,
        is_featured: false,
        is_premium: false,
        tags: ['swot', 'strategy', 'analysis', 'planning', 'competitive']
      },
      {
        id: 'empathy-map',
        title: 'Empathy Map',
        description: 'Understand your users deeply by mapping what they think, feel, see, hear, say, and do. Essential for user-centered design.',
        category: 'design',
        thumbnail_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        author: { username: 'ux_designer', avatar_url: '' },
        downloads: 7654,
        likes: 567,
        views: 14321,
        rating: 4.8,
        is_featured: false,
        is_premium: false,
        tags: ['empathy', 'user-research', 'personas', 'ux', 'user-understanding']
      },
      {
        id: 'scrum-retrospective',
        title: 'Scrum Retrospective',
        description: 'Agile retrospective template with What Went Well, What Could Be Improved, and Action Items. Perfect for sprint reviews.',
        category: 'development',
        thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        author: { username: 'agile_coach', avatar_url: '' },
        downloads: 6543,
        likes: 456,
        views: 12987,
        rating: 4.7,
        is_featured: false,
        is_premium: false,
        tags: ['scrum', 'retrospective', 'agile', 'sprint', 'continuous-improvement']
      },
      {
        id: 'okr-template',
        title: 'OKR Template',
        description: 'Objectives and Key Results framework used by Google and other top companies. Set ambitious goals and measure progress.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        author: { username: 'google_method', avatar_url: '' },
        downloads: 9876,
        likes: 723,
        views: 18654,
        rating: 4.6,
        is_featured: true,
        is_premium: false,
        tags: ['okr', 'goals', 'objectives', 'key-results', 'performance']
      },
      {
        id: 'user-story-mapping',
        title: 'User Story Mapping',
        description: 'Organize user stories into a coherent product roadmap. Visualize the user journey and prioritize features effectively.',
        category: 'development',
        thumbnail_url: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        author: { username: 'product_owner', avatar_url: '' },
        downloads: 5432,
        likes: 387,
        views: 10987,
        rating: 4.8,
        is_featured: false,
        is_premium: false,
        tags: ['user-stories', 'product-roadmap', 'agile', 'feature-prioritization']
      },
      {
        id: 'value-proposition-canvas',
        title: 'Value Proposition Canvas',
        description: 'Deep dive into your value proposition. Map customer jobs, pains, and gains against your products, pain relievers, and gain creators.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
        author: { username: 'strategyzer', avatar_url: '' },
        downloads: 8765,
        likes: 645,
        views: 16543,
        rating: 4.9,
        is_featured: false,
        is_premium: true,
        tags: ['value-proposition', 'customer-fit', 'product-market-fit', 'canvas']
      },
      {
        id: 'impact-mapping',
        title: 'Impact Mapping',
        description: 'Strategic planning technique that helps organizations make better decisions. Connect goals with deliverables through actors and impacts.',
        category: 'business',
        thumbnail_url: 'https://images.unsplash.com/photo-1558618663-fcd0c94cd4d4?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        author: { username: 'impact_method', avatar_url: '' },
        downloads: 4321,
        likes: 298,
        views: 8765,
        rating: 4.7,
        is_featured: false,
        is_premium: true,
        tags: ['impact-mapping', 'strategic-planning', 'goal-alignment', 'decision-making']
      },
      {
        id: 'kanban-board',
        title: 'Kanban Board',
        description: 'Visual workflow management system. Organize tasks into To Do, In Progress, and Done columns with customizable swim lanes.',
        category: 'development',
        thumbnail_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop',
        created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
        author: { username: 'lean_expert', avatar_url: '' },
        downloads: 7890,
        likes: 567,
        views: 15432,
        rating: 4.5,
        is_featured: false,
        is_premium: false,
        tags: ['kanban', 'workflow', 'task-management', 'visual-management', 'lean']
      }
    ];
    
    setTemplates(realTemplates);
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('template-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'boards' },
        (payload) => {
          if (payload.new && (payload.new as any).is_template) {
            console.log('New template detected:', payload);
            loadTemplates();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter(t => t.is_featured);
  const trendingTemplates = [...templates].sort((a, b) => b.downloads - a.downloads).slice(0, 6);

  const handleUseTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Generate canvas data for the template
    const { TemplateService } = await import('@/utils/TemplateService');
    const canvasData = TemplateService.generateCanvasData(templateId);

    // Create a new board from template
    const { data, error } = await supabase
      .from('boards')
      .insert({
        title: `${template.title} (Copy)`,
        description: template.description,
        owner_id: user?.id,
        canvas_data: canvasData as any, // Cast to any to work with Json type
        is_template: false
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create board from template",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Board created from template! 🎉"
    });

    navigate(`/board/${data.id}`);
  };

  const handleLikeTemplate = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? { ...t, likes: t.likes + 1 }
        : t
    ));
    toast({
      title: "Liked!",
      description: "Template added to your favorites ❤️"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse glass-dark border-border/30">
                <div className="h-48 bg-muted/50 rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted/50 rounded w-full"></div>
                    <div className="h-3 bg-muted/50 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="p-2"
              >
                ←
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Templates</h1>
                  <p className="text-sm text-muted-foreground">Discover and use professional templates</p>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-accent to-primary">
              <Star className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-dark border-border/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="glass-dark border-border/30">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'bg-gradient-to-r from-accent to-primary' 
                    : 'glass-dark border-border/30'
                }`}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-dark border-border/30">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className="glass-dark border-border/30 hover:border-accent/40 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-accent/20 overflow-hidden group">
                    {/* Thumbnail */}
                    <div className="h-48 bg-gradient-to-br from-accent/20 via-primary/15 to-secondary/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {template.is_featured && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                            <Crown className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {template.is_premium && (
                          <Badge variant="secondary" className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-white">{template.rating}</span>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-accent transition-colors font-bold line-clamp-1">
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-accent/30">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-muted">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span>{template.downloads}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{template.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{template.views}</span>
                          </div>
                        </div>
                      </div>

                      {/* Author */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-accent to-primary text-white">
                              {template.author.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">@{template.author.username}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(template.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-accent to-primary hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template.id);
                          }}
                        >
                          Use Template
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="glass-dark border-border/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeTemplate(template.id);
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="glass-dark border-border/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="featured">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {featuredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  {/* Same card structure as above but filtered for featured */}
                  <Card className="glass-dark border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-yellow-500/20 overflow-hidden group">
                    <div className="h-48 bg-gradient-to-br from-yellow-500/20 via-accent/15 to-primary/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                      <div className="absolute top-3 right-3">
                        <Badge className="text-xs bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                          <Crown className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-white">{template.rating}</span>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-yellow-400 transition-colors font-bold line-clamp-1">
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-yellow-500/30">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-accent hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template.id);
                          }}
                        >
                          Use Featured Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="trending">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {trendingTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className="glass-dark border-green-500/30 hover:border-green-500/60 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-green-500/20 overflow-hidden group">
                    <div className="h-48 bg-gradient-to-br from-green-500/20 via-accent/15 to-primary/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                      <div className="absolute top-3 right-3">
                        <Badge className="text-xs bg-green-500/20 border-green-500/30 text-green-300">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          #{index + 1} Trending
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3 text-white" />
                          <span className="text-sm font-medium text-white">{template.downloads}</span>
                        </div>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-green-400 transition-colors font-bold line-clamp-1">
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-green-500 to-accent hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template.id);
                          }}
                        >
                          Use Trending Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="my-templates">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center py-16"
            >
              <div className="glass-dark rounded-3xl p-16 border border-border/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5" />
                <div className="relative">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                    <Star className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Create Your First Template</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                    Share your designs with the community and help others create amazing projects.
                  </p>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-accent via-primary to-secondary hover:scale-105 transition-transform shadow-2xl shadow-accent/25"
                  >
                    <Star className="h-5 w-5 mr-2" />
                    Create Template
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
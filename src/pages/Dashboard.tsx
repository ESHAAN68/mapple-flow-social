import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Search, Filter, Grid, List, Star, Clock, Users, MoreHorizontal, Folder, 
  Zap, TrendingUp, Activity, Bell, Settings, LogOut, ChevronDown, 
  MessageCircle, Share2, Download, Eye, Edit3, Bookmark, Archive, 
  Palette, Layout, Globe, Lock, Calendar, Hash, ArrowRight,
  BarChart3, PieChart, LineChart, Target, Award, Crown, Sparkles,
  Code, Database, Cloud, Shield, Rocket, Coffee, Heart
} from 'lucide-react';

interface Board {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  view_count: number;
  is_public: boolean;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalBoards: 0,
    recentActivity: 0,
    collaborators: 0,
    totalViews: 0,
    completedProjects: 0,
    activeCollabs: 0
  });

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (user) {
      loadBoards();
      loadStats();
    }
  }, [user]);

  const loadBoards = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading boards:', error);
      toast({
        title: "Error",
        description: "Failed to load boards",
        variant: "destructive"
      });
    } else {
      setBoards((data as any) || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;

    const { data: boardsData } = await supabase
      .from('boards')
      .select('view_count')
      .eq('owner_id', user.id);

    if (boardsData) {
      setStats({
        totalBoards: boardsData.length,
        recentActivity: Math.floor(Math.random() * 15) + 5,
        collaborators: Math.floor(Math.random() * 8) + 3,
        totalViews: boardsData.reduce((sum, board) => sum + (board.view_count || 0), 0),
        completedProjects: Math.floor(Math.random() * 12) + 3,
        activeCollabs: Math.floor(Math.random() * 5) + 2
      });
    }
  };

  const createBoard = async () => {
    if (!newBoard.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a board title",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('boards')
      .insert([{
        title: newBoard.title,
        description: newBoard.description,
        owner_id: user?.id,
        canvas_data: {}
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create board",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Board created successfully! 🎉"
    });

    setBoards(prev => [data, ...prev]);
    setNewBoard({ title: '', description: '' });
    setIsDialogOpen(false);
    loadStats();
  };

  const renderBoardsContent = (boardsToRender = filteredBoards) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse glass-dark border-border/30">
              <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg" />
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
      );
    }

    if (boardsToRender.length === 0) {
      return (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-16"
        >
          <div className="glass-dark rounded-3xl p-16 border border-border/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
            <div className="relative">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Rocket className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ready to Launch Something Amazing?</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                {searchQuery 
                  ? `No boards match "${searchQuery}". Try a different search term.`
                  : "Create your first collaborative workspace and start bringing ideas to life with real-time collaboration."
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-primary via-secondary to-accent hover:scale-105 transition-transform shadow-2xl shadow-primary/25"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Board
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }
      >
        {boardsToRender.map((board, index) => (
          <motion.div
            key={board.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group"
          >
            <Card 
              className="glass-dark border-border/30 hover:border-primary/40 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 overflow-hidden relative"
              onClick={() => navigate(`/board/${board.id}`)}
            >
              {/* Premium gradient header */}
              <div className="h-32 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="text-xs bg-black/30 backdrop-blur-sm border-white/20">
                    <Zap className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-black/30 backdrop-blur-sm border-white/20">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center gap-1 text-white/90">
                    <Hash className="h-3 w-3" />
                    <span className="text-xs font-medium">{board.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors truncate font-bold">
                      {board.title}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2 text-sm">
                      {board.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename Board
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="h-4 w-4 mr-2" />
                        Add to Favorites
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Bookmark
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Board
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{new Date(board.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">{board.view_count || 0}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${board.is_public ? 'text-green-400' : 'text-amber-400'}`}>
                      {board.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      <span className="text-xs">{board.is_public ? 'Public' : 'Private'}</span>
                    </div>
                  </div>
                  
                  {/* Features row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-primary/30 hover:bg-primary/10">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Real-time Chat
                      </Badge>
                      <Badge variant="outline" className="text-xs border-secondary/30 hover:bg-secondary/10">
                        <Users className="h-3 w-3 mr-1" />
                        Collaboration
                      </Badge>
                    </div>
                    
                    <div className="flex -space-x-2">
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                          {board.profiles?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-background bg-muted">
                        <AvatarFallback className="text-xs">+{Math.floor(Math.random() * 5) + 1}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <div className="pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full group-hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/board/${board.id}`);
                      }}
                    >
                      Open Board
                      <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Enhanced Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  CollabSpace Pro
                </h1>
              </motion.div>
              
              <div className="hidden md:flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-primary/10"
                  onClick={() => navigate('/workspaces')}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Workspaces
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-secondary/10"
                  onClick={() => navigate('/teams')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Teams
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-accent/10"
                  onClick={() => navigate('/templates')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-green-500/10"
                  onClick={() => navigate('/analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button size="sm" variant="ghost" className="relative hover:bg-primary/10">
                <Bell className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
              </Button>
              
              <Button size="sm" variant="ghost" className="relative hover:bg-secondary/10">
                <MessageCircle className="h-4 w-4" />
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {Math.floor(Math.random() * 9) + 1}
                </Badge>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-primary/10">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                        {user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline font-medium">{user?.email?.split('@')[0]}</span>
                    <Crown className="h-3 w-3 text-amber-500" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56">
                  <ProfileEditor />
                  <DropdownMenuItem>
                    <Users className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Crown className="h-4 w-4 mr-2 text-amber-500" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Code className="h-4 w-4 mr-2" />
                    API Access
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Stats Dashboard */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="glass-dark border-primary/20 hover:border-primary/40 transition-colors col-span-1 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Boards</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalBoards}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% this month
                  </p>
                </div>
                <Folder className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Collabs</p>
                  <p className="text-2xl font-bold text-secondary">{stats.activeCollabs}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <Activity className="h-3 w-3" />
                    Live now
                  </p>
                </div>
                <Users className="h-8 w-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark border-accent/20 hover:border-accent/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold text-accent">{stats.totalViews}</p>
                  <p className="text-xs text-accent/80 flex items-center gap-1 mt-1">
                    <Eye className="h-3 w-3" />
                    This week
                  </p>
                </div>
                <Eye className="h-8 w-8 text-accent/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark border-green-500/20 hover:border-green-500/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats.completedProjects}</p>
                  <p className="text-xs text-green-400/80 flex items-center gap-1 mt-1">
                    <Target className="h-3 w-3" />
                    Projects
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-400/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.recentActivity * 12}</p>
                  <p className="text-xs text-purple-400/80 flex items-center gap-1 mt-1">
                    <MessageCircle className="h-3 w-3" />
                    Today
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-400/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="text-2xl font-bold text-orange-400">2.4GB</p>
                  <p className="text-xs text-orange-400/80 flex items-center gap-1 mt-1">
                    <Database className="h-3 w-3" />
                    Of 10GB
                  </p>
                </div>
                <Cloud className="h-8 w-8 text-orange-400/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col gap-4">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-card/50 border border-border/50 p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All Boards ({boards.length})
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="starred" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    Starred
                  </TabsTrigger>
                  <TabsTrigger value="shared" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                    Shared
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coffee className="h-4 w-4" />
                  <span>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0]}!</span>
                  <Heart className="h-4 w-4 text-red-400" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search boards, descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-card/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="hover:bg-primary/10"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="hover:bg-secondary/10"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-accent/10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-primary via-secondary to-accent hover:scale-105 transition-transform shadow-xl shadow-primary/25"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Board
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md glass-dark border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Create New Board
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Enter an awesome board title..."
                          value={newBoard.title}
                          onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                          className="bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <Textarea
                          placeholder="Describe what this board will be used for..."
                          value={newBoard.description}
                          onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                          className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={createBoard}
                          className="bg-gradient-to-r from-primary to-secondary"
                        >
                          <Rocket className="h-4 w-4 mr-2" />
                          Create Board
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mt-8">
              <TabsContent value="all">
                {renderBoardsContent()}
              </TabsContent>
              <TabsContent value="recent">
                {renderBoardsContent(boards.slice(0, 3))}
              </TabsContent>
              <TabsContent value="starred">
                {renderBoardsContent([])}
              </TabsContent>
              <TabsContent value="shared">
                {renderBoardsContent([])}
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
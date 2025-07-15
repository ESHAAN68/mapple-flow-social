import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Folder, Plus, Search, Users, Settings, Star, 
  BarChart3, Clock, Globe, Lock, MessageCircle,
  FolderOpen, Sparkles, Target, TrendingUp, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Workspace {
  id: string;
  name: string;
  description: string;
  created_at: string;
  board_count: number;
  member_count: number;
  is_favorite: boolean;
  owner: {
    username: string;
    avatar_url?: string;
  };
}

export default function Workspaces() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadWorkspaces();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    // Simulate workspace data since we don't have a dedicated workspaces table
    const { data: boards } = await supabase
      .from('boards')
      .select(`
        *,
        profiles!boards_owner_id_fkey(username, avatar_url)
      `)
      .eq('owner_id', user?.id);

    if (boards) {
      // Group boards by owner to create workspace-like view
      const mockWorkspaces: Workspace[] = [
        {
          id: 'personal',
          name: 'Personal Workspace',
          description: 'Your personal boards and projects',
          created_at: new Date().toISOString(),
          board_count: boards.length,
          member_count: 1,
          is_favorite: true,
          owner: {
            username: user?.email?.split('@')[0] || 'User',
            avatar_url: ''
          }
        },
        {
          id: 'team-alpha',
          name: 'Team Alpha',
          description: 'Collaborative projects with the core team',
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          board_count: Math.floor(Math.random() * 15) + 5,
          member_count: Math.floor(Math.random() * 8) + 3,
          is_favorite: false,
          owner: {
            username: 'team-lead',
            avatar_url: ''
          }
        },
        {
          id: 'design-studio',
          name: 'Design Studio',
          description: 'Creative workspace for design experiments',
          created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
          board_count: Math.floor(Math.random() * 10) + 3,
          member_count: Math.floor(Math.random() * 6) + 2,
          is_favorite: true,
          owner: {
            username: 'designer',
            avatar_url: ''
          }
        }
      ];
      setWorkspaces(mockWorkspaces);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('workspace-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'boards' },
        (payload) => {
          console.log('Workspace change detected:', payload);
          loadWorkspaces(); // Refresh workspace data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWorkspaceClick = (workspaceId: string) => {
    if (workspaceId === 'personal') {
      navigate('/dashboard');
    } else {
      toast({
        title: "Coming Soon",
        description: "Team workspaces will be available soon!",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse glass-dark border-border/30">
                <CardHeader>
                  <div className="h-6 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted/50 rounded w-full"></div>
                    <div className="h-4 bg-muted/50 rounded w-2/3"></div>
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
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Workspaces</h1>
                  <p className="text-sm text-muted-foreground">Organize your boards and collaborate with teams</p>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Stats */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-dark border-border/30"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                    <Folder className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workspaces.length}</p>
                    <p className="text-sm text-muted-foreground">Workspaces</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workspaces.reduce((sum, w) => sum + w.member_count, 0)}</p>
                    <p className="text-sm text-muted-foreground">Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workspaces.reduce((sum, w) => sum + w.board_count, 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Boards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workspaces.filter(w => w.is_favorite).length}</p>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workspaces Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredWorkspaces.map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card 
                className="glass-dark border-border/30 hover:border-primary/40 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 overflow-hidden group"
                onClick={() => handleWorkspaceClick(workspace.id)}
              >
                {/* Header */}
                <div className="h-24 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    {workspace.is_favorite && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                        <Star className="h-3 w-3 mr-1" />
                        Favorite
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs bg-black/30 backdrop-blur-sm border-white/20">
                      <Target className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors font-bold">
                        {workspace.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {workspace.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{workspace.board_count} boards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-secondary" />
                        <span className="text-muted-foreground">{workspace.member_count} members</span>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                            {workspace.owner.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">@{workspace.owner.username}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(workspace.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Badges */}
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs border-primary/30">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat Enabled
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-500/30">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Growing
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
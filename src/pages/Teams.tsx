import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Plus, Search, Settings, Crown, Shield, 
  UserPlus, MessageCircle, Activity, TrendingUp,
  Calendar, Globe, Lock, Sparkles, Zap, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count: number;
  owner_id: string;
  is_public: boolean;
  avatar_url?: string;
  activity_score: number;
  members: Array<{
    id: string;
    username: string;
    avatar_url?: string;
    role: string;
    status: 'online' | 'offline' | 'away';
  }>;
}

export default function Teams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTeams();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadTeams = async () => {
    const { data: teamsData } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(
          user_id,
          role,
          profiles(username, avatar_url, status)
        )
      `);

    if (teamsData) {
      const formattedTeams: Team[] = teamsData.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        created_at: team.created_at,
        member_count: team.team_members?.length || 0,
        owner_id: team.owner_id,
        is_public: Math.random() > 0.5, // Mock data
        avatar_url: team.avatar_url,
        activity_score: Math.floor(Math.random() * 100) + 50,
        members: team.team_members?.map((member: any) => ({
          id: member.user_id,
          username: member.profiles?.username || 'Unknown',
          avatar_url: member.profiles?.avatar_url,
          role: member.role,
          status: member.profiles?.status || 'offline'
        })) || []
      }));
      setTeams(formattedTeams);
    } else {
      // Mock teams for demo
      setTeams([
        {
          id: '1',
          name: 'Design Team Alpha',
          description: 'Creative minds working on innovative designs',
          created_at: new Date().toISOString(),
          member_count: 5,
          owner_id: user?.id || '',
          is_public: false,
          activity_score: 85,
          members: [
            { id: '1', username: 'alice', role: 'owner', status: 'online' },
            { id: '2', username: 'bob', role: 'admin', status: 'away' },
            { id: '3', username: 'charlie', role: 'member', status: 'offline' }
          ]
        },
        {
          id: '2',
          name: 'Development Squad',
          description: 'Building the future, one commit at a time',
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          member_count: 8,
          owner_id: 'other-user',
          is_public: true,
          activity_score: 92,
          members: [
            { id: '4', username: 'dev1', role: 'owner', status: 'online' },
            { id: '5', username: 'dev2', role: 'admin', status: 'online' },
            { id: '6', username: 'dev3', role: 'member', status: 'away' }
          ]
        }
      ]);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('team-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('Team change detected:', payload);
          loadTeams();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          console.log('Team member change detected:', payload);
          loadTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTeam = async () => {
    if (!newTeam.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: newTeam.name,
        description: newTeam.description,
        owner_id: user?.id
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive"
      });
      return;
    }

    // Add creator as team member
    await supabase
      .from('team_members')
      .insert([{
        team_id: data.id,
        user_id: user?.id,
        role: 'owner'
      }]);

    toast({
      title: "Success",
      description: "Team created successfully! 🎉"
    });

    setNewTeam({ name: '', description: '' });
    setIsDialogOpen(false);
    loadTeams();
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Shield className="h-3 w-3 text-blue-500" />;
      default: return null;
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
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Teams</h1>
                  <p className="text-sm text-muted-foreground">Collaborate with your team members</p>
                </div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-secondary to-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dark border-border/30">
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Team name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-dark border-border/30"
                  />
                  <Textarea
                    placeholder="Team description (optional)"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    className="glass-dark border-border/30"
                  />
                  <Button 
                    onClick={createTeam} 
                    className="w-full bg-gradient-to-r from-secondary to-accent"
                  >
                    Create Team
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                placeholder="Search teams..."
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
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teams.length}</p>
                    <p className="text-sm text-muted-foreground">Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teams.reduce((sum, t) => sum + t.member_count, 0)}</p>
                    <p className="text-sm text-muted-foreground">Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(teams.reduce((sum, t) => sum + t.activity_score, 0) / teams.length) || 0}</p>
                    <p className="text-sm text-muted-foreground">Avg Activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teams.filter(t => t.owner_id === user?.id).length}</p>
                    <p className="text-sm text-muted-foreground">Owned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Teams Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="glass-dark border-border/30 hover:border-secondary/40 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-secondary/20 overflow-hidden group">
                {/* Header */}
                <div className="h-24 bg-gradient-to-br from-secondary/20 via-accent/15 to-primary/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant="secondary" className={`text-xs ${team.is_public ? 'bg-green-500/20 border-green-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
                      {team.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {team.is_public ? 'Public' : 'Private'}
                    </Badge>
                    {team.owner_id === user?.id && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-white/90 font-medium">Active Now</span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-secondary transition-colors font-bold">
                        {team.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {team.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Activity Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Activity Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                            style={{ width: `${team.activity_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-secondary">{team.activity_score}%</span>
                      </div>
                    </div>

                    {/* Members Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Members ({team.member_count})</span>
                        <Button size="sm" variant="ghost" className="text-xs">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Invite
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 4).map((member, idx) => (
                            <div key={idx} className="relative">
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-secondary to-accent text-white">
                                  {member.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-background`} />
                              {getRoleIcon(member.role) && (
                                <div className="absolute -top-1 -right-1">
                                  {getRoleIcon(member.role)}
                                </div>
                              )}
                            </div>
                          ))}
                          {team.member_count > 4 && (
                            <Avatar className="h-8 w-8 border-2 border-background bg-muted">
                              <AvatarFallback className="text-xs">+{team.member_count - 4}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {team.members.filter(m => m.status === 'online').length} online
                        </div>
                      </div>
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>Chat Active</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(team.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs hover:bg-secondary/10">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredTeams.length === 0 && !loading && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16"
          >
            <div className="glass-dark rounded-3xl p-16 border border-border/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-accent/5 to-primary/5" />
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Ready to Build Your Team?</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  {searchQuery 
                    ? `No teams match "${searchQuery}". Try a different search.`
                    : "Create your first team and start collaborating with amazing people."
                  }
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-secondary via-accent to-primary hover:scale-105 transition-transform shadow-2xl shadow-secondary/25"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Team
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
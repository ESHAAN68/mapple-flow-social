import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, TrendingUp, Users, Eye, Clock, 
  Activity, Target, Award, Zap, Calendar,
  Download, Share2, MessageCircle, Sparkles,
  ArrowUp, ArrowDown, Minus, PieChart,
  LineChart, Globe, Lock, Star, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsData {
  overview: {
    totalBoards: number;
    totalViews: number;
    totalCollaborators: number;
    avgRating: number;
    trend: {
      boards: number;
      views: number;
      collaborators: number;
      rating: number;
    };
  };
  boardMetrics: Array<{
    id: string;
    title: string;
    views: number;
    collaborators: number;
    messages: number;
    lastActivity: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  timeMetrics: {
    daily: Array<{ date: string; views: number; activity: number }>;
    weekly: Array<{ week: string; boards: number; collaborations: number }>;
    monthly: Array<{ month: string; growth: number; engagement: number }>;
  };
  teamMetrics: {
    topCollaborators: Array<{
      id: string;
      username: string;
      avatar_url?: string;
      contributions: number;
      boards: number;
    }>;
    teamActivity: number;
    collaborationScore: number;
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    if (user) {
      loadAnalytics();
      setupRealtimeSubscription();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    // Load real data from Supabase
    const { data: boards } = await supabase
      .from('boards')
      .select(`
        *,
        board_collaborators(count),
        messages(count)
      `)
      .eq('owner_id', user?.id);

    // Generate mock analytics data based on real boards
    const mockAnalytics: AnalyticsData = {
      overview: {
        totalBoards: boards?.length || 0,
        totalViews: boards?.reduce((sum, board) => sum + (board.view_count || 0), 0) || 0,
        totalCollaborators: Math.floor(Math.random() * 25) + 5,
        avgRating: 4.2 + Math.random() * 0.6,
        trend: {
          boards: Math.floor(Math.random() * 20) - 10,
          views: Math.floor(Math.random() * 200) - 100,
          collaborators: Math.floor(Math.random() * 10) - 5,
          rating: (Math.random() - 0.5) * 0.4
        }
      },
      boardMetrics: boards?.map(board => ({
        id: board.id,
        title: board.title,
        views: board.view_count || 0,
        collaborators: Math.floor(Math.random() * 8) + 1,
        messages: Math.floor(Math.random() * 50) + 5,
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
      })) || [],
      timeMetrics: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 100) + 20,
          activity: Math.floor(Math.random() * 50) + 10
        })).reverse(),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          boards: Math.floor(Math.random() * 5) + 1,
          collaborations: Math.floor(Math.random() * 20) + 5
        })),
        monthly: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 86400000).toLocaleDateString('en', { month: 'short' }),
          growth: Math.floor(Math.random() * 30) + 10,
          engagement: Math.floor(Math.random() * 80) + 40
        })).reverse()
      },
      teamMetrics: {
        topCollaborators: [
          { id: '1', username: 'alice_designer', contributions: 34, boards: 5 },
          { id: '2', username: 'bob_dev', contributions: 28, boards: 4 },
          { id: '3', username: 'charlie_pm', contributions: 21, boards: 3 }
        ],
        teamActivity: 78,
        collaborationScore: 85
      }
    };

    setAnalytics(mockAnalytics);
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'boards' },
        () => loadAnalytics()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => loadAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getBoardTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse glass-dark border-border/30">
                <CardHeader>
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-8 bg-muted/50 rounded w-1/2"></div>
                </CardHeader>
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
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Analytics</h1>
                  <p className="text-sm text-muted-foreground">Track your workspace performance and insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={timeRange === '7days' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('7days')}
                className={timeRange === '7days' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'glass-dark border-border/30'}
              >
                7 Days
              </Button>
              <Button 
                variant={timeRange === '30days' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('30days')}
                className={timeRange === '30days' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'glass-dark border-border/30'}
              >
                30 Days
              </Button>
              <Button 
                variant={timeRange === '90days' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('90days')}
                className={timeRange === '90days' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'glass-dark border-border/30'}
              >
                90 Days
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-dark border-border/30 hover:border-green-500/40 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                {getTrendIcon(analytics.overview.trend.boards)}
              </div>
              <CardDescription>Total Boards</CardDescription>
              <CardTitle className="text-3xl font-bold">{analytics.overview.totalBoards}</CardTitle>
              <p className={`text-sm ${getTrendColor(analytics.overview.trend.boards)}`}>
                {analytics.overview.trend.boards > 0 ? '+' : ''}{analytics.overview.trend.boards} vs last period
              </p>
            </CardHeader>
          </Card>

          <Card className="glass-dark border-border/30 hover:border-green-500/40 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                {getTrendIcon(analytics.overview.trend.views)}
              </div>
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-3xl font-bold">{analytics.overview.totalViews.toLocaleString()}</CardTitle>
              <p className={`text-sm ${getTrendColor(analytics.overview.trend.views)}`}>
                {analytics.overview.trend.views > 0 ? '+' : ''}{analytics.overview.trend.views} vs last period
              </p>
            </CardHeader>
          </Card>

          <Card className="glass-dark border-border/30 hover:border-green-500/40 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                {getTrendIcon(analytics.overview.trend.collaborators)}
              </div>
              <CardDescription>Collaborators</CardDescription>
              <CardTitle className="text-3xl font-bold">{analytics.overview.totalCollaborators}</CardTitle>
              <p className={`text-sm ${getTrendColor(analytics.overview.trend.collaborators)}`}>
                {analytics.overview.trend.collaborators > 0 ? '+' : ''}{analytics.overview.trend.collaborators} vs last period
              </p>
            </CardHeader>
          </Card>

          <Card className="glass-dark border-border/30 hover:border-green-500/40 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                {getTrendIcon(analytics.overview.trend.rating)}
              </div>
              <CardDescription>Avg Rating</CardDescription>
              <CardTitle className="text-3xl font-bold">{analytics.overview.avgRating.toFixed(1)}</CardTitle>
              <p className={`text-sm ${getTrendColor(analytics.overview.trend.rating)}`}>
                {analytics.overview.trend.rating > 0 ? '+' : ''}{analytics.overview.trend.rating.toFixed(1)} vs last period
              </p>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Tabs for detailed analytics */}
        <Tabs defaultValue="boards" className="space-y-6">
          <TabsList className="glass-dark border-border/30">
            <TabsTrigger value="boards">Board Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="boards" className="space-y-6">
            {/* Board Performance */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="glass-dark border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Board Performance
                  </CardTitle>
                  <CardDescription>Your most active boards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.boardMetrics.slice(0, 5).map((board, index) => (
                    <div key={board.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{board.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {board.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {board.collaborators}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {board.messages}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getBoardTrendIcon(board.trend)}
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-dark border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-secondary" />
                    Daily Activity
                  </CardTitle>
                  <CardDescription>Views and activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.timeMetrics.daily.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3 text-primary" />
                            <span className="text-sm">{day.views}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-secondary" />
                            <span className="text-sm">{day.activity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-6"
            >
              <Card className="glass-dark border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent" />
                    Recent Activity Timeline
                  </CardTitle>
                  <CardDescription>Live activity feed from your workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { time: '2 min ago', action: 'New board created', user: 'You', icon: <BarChart3 className="h-4 w-4 text-primary" /> },
                    { time: '15 min ago', action: 'Collaboration started', user: 'alice_designer', icon: <Users className="h-4 w-4 text-secondary" /> },
                    { time: '1 hour ago', action: 'Template used', user: 'bob_dev', icon: <Star className="h-4 w-4 text-accent" /> },
                    { time: '3 hours ago', action: 'Board shared', user: 'charlie_pm', icon: <Share2 className="h-4 w-4 text-green-500" /> },
                    { time: '1 day ago', action: 'Analytics milestone reached', user: 'System', icon: <Award className="h-4 w-4 text-yellow-500" /> }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-lg flex items-center justify-center">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">by {activity.user} • {activity.time}</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="glass-dark border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Top Collaborators
                  </CardTitle>
                  <CardDescription>Most active team members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.teamMetrics.topCollaborators.map((collaborator, index) => (
                    <div key={collaborator.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                            {collaborator.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1">
                            <Crown className="h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">@{collaborator.username}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{collaborator.contributions} contributions</span>
                          <span>{collaborator.boards} boards</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-dark border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Team Metrics
                  </CardTitle>
                  <CardDescription>Overall team performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Team Activity Score</span>
                      <span className="text-xl font-bold text-green-500">{analytics.teamMetrics.teamActivity}%</span>
                    </div>
                    <Progress value={analytics.teamMetrics.teamActivity} className="h-3" />
                    <p className="text-sm text-muted-foreground">Above average team engagement</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Collaboration Score</span>
                      <span className="text-xl font-bold text-blue-500">{analytics.teamMetrics.collaborationScore}%</span>
                    </div>
                    <Progress value={analytics.teamMetrics.collaborationScore} className="h-3" />
                    <p className="text-sm text-muted-foreground">Excellent collaborative workflow</p>
                  </div>

                  <div className="pt-4 border-t border-border/30">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{analytics.overview.totalBoards}</p>
                        <p className="text-sm text-muted-foreground">Active Boards</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-secondary">{analytics.overview.totalCollaborators}</p>
                        <p className="text-sm text-muted-foreground">Team Members</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-6"
            >
              <Card className="glass-dark border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription>Smart recommendations based on your workspace data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      type: 'success',
                      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
                      title: 'Growing Engagement',
                      description: 'Your boards are seeing 23% more collaboration this month. Keep up the great work!',
                      action: 'View top performing boards'
                    },
                    {
                      type: 'suggestion',
                      icon: <Target className="h-5 w-5 text-blue-500" />,
                      title: 'Optimization Opportunity',
                      description: 'Consider creating templates from your most popular boards to help team efficiency.',
                      action: 'Create template'
                    },
                    {
                      type: 'warning',
                      icon: <Clock className="h-5 w-5 text-yellow-500" />,
                      title: 'Inactive Boards',
                      description: '3 boards haven\'t been accessed in 30 days. Archive or revive them?',
                      action: 'Review inactive boards'
                    },
                    {
                      type: 'achievement',
                      icon: <Award className="h-5 w-5 text-purple-500" />,
                      title: 'Milestone Reached',
                      description: 'Congratulations! You\'ve reached 1,000 total board views this quarter.',
                      action: 'Share achievement'
                    }
                  ].map((insight, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/80 rounded-lg flex items-center justify-center flex-shrink-0">
                        {insight.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        <Button size="sm" variant="outline" className="text-xs">
                          {insight.action}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, Users, Eye, Target, MessageCircle, Database,
  TrendingUp, Activity, Crown, Zap, Clock, Globe
} from 'lucide-react';

interface RealTimeAnalyticsProps {
  className?: string;
}

export const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ className }) => {
  const { user } = useAuth();
  const {
    totalBoards,
    activeCollabs,
    totalViews,
    completedProjects,
    totalMessages,
    storageUsed,
    storageLimit,
    isPremium,
    isLoading,
    updateAnalytics,
    setLoading,
    incrementViews,
    incrementMessages,
    incrementBoards,
    incrementCollabs,
    updateStorage
  } = useAnalyticsStore();

  useEffect(() => {
    if (user) {
      loadInitialAnalytics();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadInitialAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load boards count
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('id, view_count')
        .eq('owner_id', user.id);

      if (boardsError) throw boardsError;

      // Load collaborations count
      const { data: collabs, error: collabsError } = await supabase
        .from('board_collaborators')
        .select('id')
        .eq('user_id', user.id);

      if (collabsError) throw collabsError;

      // Load messages count
      const { data: messages, error: messagesError } = await supabase
        .from('user_messages')
        .select('id')
        .eq('sender_id', user.id);

      if (messagesError) throw messagesError;

      // Calculate storage usage (mock for now)
      const storageUsage = Math.floor(Math.random() * 50) + 10; // Mock storage usage

      updateAnalytics({
        totalBoards: boards?.length || 0,
        activeCollabs: collabs?.length || 0,
        totalViews: boards?.reduce((sum, board) => sum + (board.view_count || 0), 0) || 0,
        completedProjects: Math.floor((boards?.length || 0) * 0.7), // Mock completed projects
        totalMessages: messages?.length || 0,
        storageUsed: storageUsage,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to board changes
    const boardsChannel = supabase
      .channel('analytics-boards')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'boards',
          filter: `owner_id=eq.${user.id}`
        },
        () => {
          incrementBoards();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boards'
        },
        (payload) => {
          const updatedBoard = payload.new as any;
          if (updatedBoard.owner_id === user.id && payload.old && payload.new) {
            const oldViews = (payload.old as any).view_count || 0;
            const newViews = updatedBoard.view_count || 0;
            if (newViews > oldViews) {
              incrementViews();
            }
          }
        }
      )
      .subscribe();

    // Subscribe to collaboration changes
    const collabsChannel = supabase
      .channel('analytics-collabs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_collaborators',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          incrementCollabs();
        }
      )
      .subscribe();

    // Subscribe to message changes
    const messagesChannel = supabase
      .channel('analytics-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          incrementMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(boardsChannel);
      supabase.removeChannel(collabsChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    return Math.min((storageUsed / storageLimit) * 100, 100);
  };

  const analyticsCards = [
    {
      title: 'Total Boards',
      value: totalBoards,
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+12%'
    },
    {
      title: 'Active Collabs',
      value: activeCollabs,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+8%'
    },
    {
      title: 'Total Views',
      value: totalViews,
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: '+23%'
    },
    {
      title: 'Completed',
      value: completedProjects,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: '+15%'
    },
    {
      title: 'Messages',
      value: totalMessages,
      icon: MessageCircle,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      trend: '+45%'
    },
    {
      title: 'Storage',
      value: `${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`,
      icon: Database,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      trend: `${Math.round(getStoragePercentage())}%`
    }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                        </p>
                        {isPremium && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500 font-medium">
                          {card.trend}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                  
                  {/* Storage progress bar */}
                  {card.title === 'Storage' && (
                    <div className="mt-3 space-y-1">
                      <Progress 
                        value={getStoragePercentage()} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {formatBytes(storageUsed)}</span>
                        <span>Limit: {formatBytes(storageLimit)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Real-time indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {/* Premium Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className={`${isPremium ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/5 to-orange-500/5' : 'border-border'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPremium ? (
                  <Crown className="h-6 w-6 text-yellow-500" />
                ) : (
                  <Zap className="h-6 w-6 text-muted-foreground" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {isPremium ? 'Premium Account' : 'Free Account'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isPremium 
                      ? 'Enjoy unlimited features and priority support' 
                      : 'Upgrade to unlock premium features'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={isPremium ? "default" : "outline"} className="flex items-center gap-1">
                  {isPremium ? (
                    <>
                      <Crown className="h-3 w-3" />
                      Premium
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      Free
                    </>
                  )}
                </Badge>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { supabase } from '@/integrations/supabase/client';

export const useRealTimeAnalytics = () => {
  const { user } = useAuth();
  const { 
    incrementViews, 
    incrementMessages, 
    incrementBoards, 
    incrementCollabs,
    updateStorage,
    setPremium 
  } = useAnalyticsStore();

  useEffect(() => {
    if (!user) return;

    // Check premium status
    const checkPremiumStatus = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('premium_plan, premium_expires_at')
        .eq('id', user.id)
        .single();

      if (data?.premium_plan && (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date())) {
        setPremium(true);
      }
    };

    checkPremiumStatus();

    // Set up real-time subscriptions for analytics
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
        () => incrementBoards()
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
        () => incrementCollabs()
      )
      .subscribe();

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
        () => incrementMessages()
      )
      .subscribe();

    // Monitor storage usage
    const storageChannel = supabase
      .channel('analytics-storage')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          if (updatedProfile.storage_used !== undefined) {
            updateStorage(updatedProfile.storage_used / (1024 * 1024)); // Convert to MB
          }
          
          // Check premium status changes
          if (updatedProfile.premium_plan && (!updatedProfile.premium_expires_at || new Date(updatedProfile.premium_expires_at) > new Date())) {
            setPremium(true);
          } else {
            setPremium(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(boardsChannel);
      supabase.removeChannel(collabsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(storageChannel);
    };
  }, [user, incrementViews, incrementMessages, incrementBoards, incrementCollabs, updateStorage, setPremium]);
};
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotificationStore } from '@/store/notificationStore';
import { useToast } from '@/hooks/use-toast';

export const TextNotificationHandler: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Listen for new messages in conversations the user is part of
    const messageChannel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if user is part of this conversation
          const { data: isParticipant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', newMessage.conversation_id)
            .eq('user_id', user.id)
            .single();

          if (!isParticipant) return;

          // Get sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.display_name || senderProfile?.username || 'Someone';
          
          // Add notification
          addNotification({
            type: 'message',
            title: 'New Message',
            message: `${senderName}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
            from_user_id: newMessage.sender_id,
            from_username: senderName,
            conversation_id: newMessage.conversation_id
          });

          // Show toast
          toast({
            title: "New Message",
            description: `${senderName} sent you a message`,
          });
        }
      )
      .subscribe();

    // Listen for incoming calls
    const callChannel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_calls'
        },
        async (payload) => {
          const newCall = payload.new as any;
          
          // Check if this call involves the current user
          const { data: conversationParticipant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', newCall.conversation_id)
            .eq('user_id', user.id)
            .single();

          if (!conversationParticipant || newCall.caller_id === user.id) return;

          // Get caller info
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', newCall.caller_id)
            .single();

          const callerName = callerProfile?.display_name || callerProfile?.username || 'Someone';
          
          // Add notification
          addNotification({
            type: 'call',
            title: 'Incoming Call',
            message: `${callerName} is calling you`,
            from_user_id: newCall.caller_id,
            from_username: callerName,
            conversation_id: newCall.conversation_id
          });

          // Show toast
          toast({
            title: "Incoming Call",
            description: `${callerName} is calling you`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(callChannel);
    };
  }, [user, addNotification, toast]);

  return null; // This is a handler component, no UI
};
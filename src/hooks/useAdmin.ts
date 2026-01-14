import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

// Admin emails that have access to admin panel
const ADMIN_EMAILS = ['eshaanniranjan460@gmail.com'];

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if user's email is in the admin list
      const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
      setIsAdmin(isAdminEmail);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}

export function useAdminActions() {
  const { user } = useAuth();

  const sendAnnouncement = async (title: string, content: string, type: 'info' | 'warning' | 'critical') => {
    if (!user) throw new Error('Must be authenticated');

    // Create the announcement
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        announcement_type: type,
        created_by: user.id,
      })
      .select()
      .single();

    if (announcementError) throw announcementError;

    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) throw profilesError;

    // Create user_announcements for all users
    if (profiles && profiles.length > 0) {
      const userAnnouncements = profiles.map(profile => ({
        user_id: profile.id,
        announcement_id: announcement.id,
      }));

      const { error: insertError } = await supabase
        .from('user_announcements')
        .insert(userAnnouncements);

      if (insertError) throw insertError;
    }

    return announcement;
  };

  const sendWarning = async (userId: string, subject: string, content: string, type: 'info' | 'warning' | 'final_warning') => {
    if (!user) throw new Error('Must be authenticated');

    // First, store in admin_messages for record keeping
    const { data, error } = await supabase
      .from('admin_messages')
      .insert({
        user_id: userId,
        sender_id: user.id,
        subject,
        content,
        message_type: type,
      })
      .select()
      .single();

    if (error) throw error;

    // Also send as a DM so it appears in their chat
    try {
      // Use the start_conversation function to get/create conversation
      const { data: conversationId, error: convError } = await supabase.rpc('start_conversation', {
        other_user_id: userId
      });

      if (!convError && conversationId) {
        // Send the warning as a message in the DM
        const formattedMessage = `⚠️ **${subject}**\n\n${content}`;
        
        await supabase
          .from('user_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: formattedMessage,
            message_type: 'text'
          });
      }
    } catch (dmError) {
      console.error('Failed to send warning as DM:', dmError);
      // Don't throw - the admin message was still saved
    }

    return data;
  };

  const limitUser = async (userId: string, days: number, reason: string) => {
    if (!user) throw new Error('Must be authenticated');

    const limitedUntil = new Date();
    limitedUntil.setDate(limitedUntil.getDate() + days);

    const { error } = await supabase
      .from('profiles')
      .update({
        user_status: 'limited',
        limited_until: limitedUntil.toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Send notification to user
    await sendWarning(userId, 'Account Limited', `Your account has been limited for ${days} days. Reason: ${reason}`, 'warning');
  };

  const banUser = async (userId: string, reason: string) => {
    if (!user) throw new Error('Must be authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        user_status: 'banned',
        ban_reason: reason,
        banned_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Send notification to user
    await sendWarning(userId, 'Account Banned', `Your account has been banned. Reason: ${reason}`, 'final_warning');
  };

  const unbanUser = async (userId: string) => {
    if (!user) throw new Error('Must be authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        user_status: 'active',
        ban_reason: null,
        banned_at: null,
        limited_until: null,
      })
      .eq('id', userId);

    if (error) throw error;
  };

  const deleteUser = async (userId: string) => {
    // Note: This will cascade delete all user data due to our foreign key setup
    // The actual auth.users deletion must be done via Supabase Admin API
    // For now, we'll just ban the user permanently
    await banUser(userId, 'Account permanently deleted by admin');
  };

  const getAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  return {
    sendAnnouncement,
    sendWarning,
    limitUser,
    banUser,
    unbanUser,
    deleteUser,
    getAllUsers,
  };
}

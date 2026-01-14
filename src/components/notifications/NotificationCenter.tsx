import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  MessageCircle, 
  Phone, 
  Users, 
  Folder,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Megaphone,
  AlertTriangle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    addNotification, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Fetch existing admin messages and announcements
    fetchAdminNotifications();

    // Set up real-time subscriptions for notifications
    const messageChannel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
        },
        async (payload) => {
          const message = payload.new;
          
          // Only notify if message is not from current user
          if (message.sender_id !== user.id) {
            // Get sender info
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('id', message.sender_id)
              .single();

            // Check if user is participant in this conversation
            const { data: isParticipant } = await supabase
              .from('conversation_participants')
              .select('id')
              .eq('conversation_id', message.conversation_id)
              .eq('user_id', user.id)
              .single();

            if (isParticipant) {
              addNotification({
                type: 'message',
                title: 'New Message',
                message: `${senderProfile?.display_name || senderProfile?.username || 'Someone'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                from_user_id: message.sender_id,
                from_username: senderProfile?.username || 'Unknown',
                conversation_id: message.conversation_id,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_collaborators',
        },
        async (payload) => {
          const collaboration = payload.new;
          
          // Only notify if invitation is for current user
          if (collaboration.user_id === user.id) {
            // Get board and inviter info
            const { data: boardData } = await supabase
              .from('boards')
              .select('title')
              .eq('id', collaboration.board_id)
              .single();

            const { data: inviterProfile } = await supabase
              .from('profiles')
              .select('username, display_name')
              .eq('id', collaboration.invited_by)
              .single();

            addNotification({
              type: 'board_invite',
              title: 'Board Invitation',
              message: `${inviterProfile?.display_name || inviterProfile?.username || 'Someone'} invited you to collaborate on "${boardData?.title || 'a board'}"`,
              from_user_id: collaboration.invited_by,
              from_username: inviterProfile?.username || 'Unknown',
              board_id: collaboration.board_id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const adminMsg = payload.new as any;
          addNotification({
            type: 'admin_warning',
            title: adminMsg.subject,
            message: adminMsg.content.substring(0, 100) + (adminMsg.content.length > 100 ? '...' : ''),
            from_user_id: adminMsg.sender_id || 'system',
            from_username: 'Admin',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_announcements',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const userAnn = payload.new as any;
          // Fetch the announcement details
          const { data: announcement } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', userAnn.announcement_id)
            .single();
          
          if (announcement) {
            addNotification({
              type: 'announcement',
              title: `📢 ${announcement.title}`,
              message: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
              from_user_id: announcement.created_by || 'system',
              from_username: 'System',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user, addNotification]);

  // Fetch existing unread admin messages and announcements
  const fetchAdminNotifications = async () => {
    if (!user) return;

    // Fetch unread admin messages
    const { data: adminMessages } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    // Fetch unread announcements
    const { data: userAnnouncements } = await supabase
      .from('user_announcements')
      .select(`*, announcement:announcements(*)`)
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    // Add admin messages as notifications (only if not already present)
    adminMessages?.forEach((msg) => {
      addNotification({
        type: 'admin_warning',
        title: msg.subject,
        message: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
        from_user_id: msg.sender_id || 'system',
        from_username: 'Admin',
      });
    });

    // Add announcements as notifications
    userAnnouncements?.forEach((ua: any) => {
      if (ua.announcement) {
        addNotification({
          type: 'announcement',
          title: `📢 ${ua.announcement.title}`,
          message: ua.announcement.content.substring(0, 100) + (ua.announcement.content.length > 100 ? '...' : ''),
          from_user_id: ua.announcement.created_by || 'system',
          from_username: 'System',
        });
      }
    });
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.conversation_id) {
          navigate('/chat');
        }
        break;
      case 'board_invite':
        if (notification.board_id) {
          navigate(`/board/${notification.board_id}`);
        }
        break;
      case 'team_invite':
        if (notification.team_id) {
          navigate('/teams');
        }
        break;
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-500" />;
      case 'board_invite':
        return <Folder className="h-4 w-4 text-purple-500" />;
      case 'team_invite':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-primary" />;
      case 'admin_warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-primary/10"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
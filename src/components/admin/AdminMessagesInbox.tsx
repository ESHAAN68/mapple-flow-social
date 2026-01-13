import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Check,
  Megaphone
} from 'lucide-react';

interface AdminMessage {
  id: string;
  subject: string;
  content: string;
  message_type: string;
  read_at: string | null;
  created_at: string;
}

interface UserAnnouncement {
  id: string;
  read_at: string | null;
  created_at: string;
  announcement: {
    id: string;
    title: string;
    content: string;
    announcement_type: string;
    created_at: string;
  };
}

export function AdminMessagesInbox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [announcements, setAnnouncements] = useState<UserAnnouncement[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<UserAnnouncement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchAnnouncements();
      subscribeToMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
      updateUnreadCount(data, announcements);
    }
  };

  const fetchAnnouncements = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_announcements')
      .select(`
        *,
        announcement:announcements(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const validAnnouncements = data.filter(a => a.announcement) as unknown as UserAnnouncement[];
      setAnnouncements(validAnnouncements);
      updateUnreadCount(messages, validAnnouncements);
    }
  };

  const updateUnreadCount = (msgs: AdminMessage[], anns: UserAnnouncement[]) => {
    const unreadMsgs = msgs.filter(m => !m.read_at).length;
    const unreadAnns = anns.filter(a => !a.read_at).length;
    setUnreadCount(unreadMsgs + unreadAnns);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_announcements',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('admin_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAnnouncementAsRead = async (announcementId: string) => {
    await supabase
      .from('user_announcements')
      .update({ read_at: new Date().toISOString() })
      .eq('id', announcementId);

    setAnnouncements(prev => prev.map(a => 
      a.id === announcementId ? { ...a, read_at: new Date().toISOString() } : a
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'final_warning':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Megaphone className="h-5 w-5 text-primary" />;
    }
  };

  const handleOpenMessage = (message: AdminMessage) => {
    setSelectedMessage(message);
    if (!message.read_at) {
      markMessageAsRead(message.id);
    }
  };

  const handleOpenAnnouncement = (announcement: UserAnnouncement) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.read_at) {
      markAnnouncementAsRead(announcement.id);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Admin Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {/* Announcements */}
            {announcements.map((ann) => (
              <button
                key={`ann-${ann.id}`}
                onClick={() => handleOpenAnnouncement(ann)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  ann.read_at ? 'bg-muted/50' : 'bg-primary/10 hover:bg-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getAnnouncementIcon(ann.announcement.announcement_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{ann.announcement.title}</p>
                      {!ann.read_at && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {ann.announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(ann.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* Direct Messages */}
            {messages.map((msg) => (
              <button
                key={`msg-${msg.id}`}
                onClick={() => handleOpenMessage(msg)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  msg.read_at ? 'bg-muted/50' : 'bg-primary/10 hover:bg-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getMessageIcon(msg.message_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{msg.subject}</p>
                      {!msg.read_at && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {msg.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {messages.length === 0 && announcements.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No messages yet
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && getMessageIcon(selectedMessage.message_type)}
              {selectedMessage?.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="whitespace-pre-wrap">{selectedMessage?.content}</p>
            <p className="text-sm text-muted-foreground">
              Received: {selectedMessage && format(new Date(selectedMessage.created_at), 'PPpp')}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Detail Dialog */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAnnouncement && getAnnouncementIcon(selectedAnnouncement.announcement.announcement_type)}
              {selectedAnnouncement?.announcement.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="whitespace-pre-wrap">{selectedAnnouncement?.announcement.content}</p>
            <p className="text-sm text-muted-foreground">
              Posted: {selectedAnnouncement && format(new Date(selectedAnnouncement.announcement.created_at), 'PPpp')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

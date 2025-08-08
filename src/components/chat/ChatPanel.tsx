import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '@/store/chatStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatPanelProps {
  boardId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ boardId }) => {
  const { user } = useAuth();
  const {
    messages,
    isOpen,
    newMessage,
    setMessages,
    addMessage,
    setIsOpen,
    setNewMessage
  } = useChatStore();

  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

      if (data) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          sender_name: (msg as any).profiles?.username || 'Unknown',
          sender_avatar: (msg as any).profiles?.avatar_url,
          created_at: msg.created_at,
          board_id: msg.board_id,
        }));
        setMessages(formattedMessages);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`board-chat:${boardId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `board_id=eq.${boardId}`
      }, payload => {
        const msg = payload.new;
        addMessage({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          sender_name: msg.profiles?.username || 'Unknown',
          sender_avatar: msg.profiles?.avatar_url,
          created_at: msg.created_at,
          board_id: msg.board_id,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, setMessages, addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([{
        content: newMessage,
        sender_id: user.id,
        board_id: boardId,
      }]);

    if (!error) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <> {/* Chat Toggle Button */} <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant={isOpen ? "secondary" : "default"}
          size="lg"
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6" />
          {messages.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
            >
              {messages.length > 9 ? '9+' : messages.length}
            </motion.span>
          )}
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 bottom-0 h-[70vh] w-96 bg-card/95 backdrop-blur-md border-l border-t border-border rounded-tl-lg z-40 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Chat</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0 p-4 overflow-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender_avatar} />
                      <AvatarFallback>
                        {message.sender_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-xs ${message.sender_id === user?.id ? 'text-right' : ''}`}> 
                      <div className="text-xs text-muted-foreground mb-1">
                        {message.sender_name} • {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}> 
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
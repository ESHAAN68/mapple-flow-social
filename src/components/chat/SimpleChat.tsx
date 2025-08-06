import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotificationStore } from '@/store/notificationStore';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Phone, 
  PhoneOff,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSearch } from './UserSearch';
import { WebRTCCall } from './WebRTCCall';

interface User {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  other_user?: User;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender?: User;
}

export const SimpleChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotificationStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load conversations
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      setupRealtimeSubscription();
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      console.log('Loading conversations for user:', user.id);
      
      // Get conversations where the user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;
      console.log('Participant data:', participantData);

      const conversationIds = participantData?.map(p => p.conversation_id) || [];
      if (conversationIds.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        return;
      }

      // Get conversation details
      const { data: conversationData, error: convError } = await supabase
        .from('user_conversations')
        .select('*')
        .in('id', conversationIds);

      if (convError) throw convError;
      console.log('Conversation data:', conversationData);

      // Get the other participants for each conversation
      const conversationsWithUsers = await Promise.all(
        (conversationData || []).map(async (conversation) => {
          // Get other participants (excluding current user)
          const { data: otherParticipants, error: otherError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversation.id)
            .neq('user_id', user.id);

          if (otherError) {
            console.error('Error fetching other participants:', otherError);
            throw otherError;
          }

          console.log('Other participants for conversation', conversation.id, ':', otherParticipants);

          let otherUser = null;
          if (otherParticipants && otherParticipants.length > 0) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .eq('id', otherParticipants[0].user_id)
                .single();
              
              console.log('Profile data for user', otherParticipants[0].user_id, ':', profileData);
              
              if (profileError) {
                console.error('Error fetching profile:', profileError);
                // If profile doesn't exist, create a fallback with the user ID
                otherUser = {
                  id: otherParticipants[0].user_id,
                  username: `User_${otherParticipants[0].user_id.slice(0, 8)}`,
                  display_name: `User_${otherParticipants[0].user_id.slice(0, 8)}`,
                  avatar_url: null
                };
              } else {
                otherUser = profileData;
              }
            } catch (error) {
              console.error('Profile fetch failed:', error);
              otherUser = {
                id: otherParticipants[0].user_id,
                username: `User_${otherParticipants[0].user_id.slice(0, 8)}`,
                display_name: `User_${otherParticipants[0].user_id.slice(0, 8)}`,
                avatar_url: null
              };
            }
          }

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('user_messages')
            .select('content')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...conversation,
            other_user: otherUser,
            last_message: lastMessageData?.[0]?.content || ''
          };
        })
      );

      const validConversations = conversationsWithUsers
        .filter(conv => conv !== null && conv.other_user !== null)
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      console.log('Final conversations:', validConversations);
      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender info for each message
      const messagesWithSender = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender: senderData
          };
        })
      );

      setMessages(messagesWithSender);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Add notification if message is not from current user
          if (newMessage.sender_id !== user?.id) {
            // Get sender info for notification
            const { data: senderData } = await supabase
              .from('profiles')
              .select('username, display_name')
              .eq('id', newMessage.sender_id)
              .single();

            addNotification({
              type: 'message',
              title: 'New Message',
              message: `${senderData?.display_name || senderData?.username || 'Someone'}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
              from_user_id: newMessage.sender_id,
              from_username: senderData?.username || 'Unknown',
              conversation_id: selectedConversation,
            });
          }

          // Get sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, sender: senderData }]);
          
          // Update conversations list
          loadConversations();
        }
      )
      .subscribe();
  };

  const startConversation = async (otherUserId: string, otherUser: User) => {
    if (!user) return;

    try {
      // Use the secure function to start/find conversation
      const { data: conversationId, error } = await supabase.rpc('start_conversation', {
        other_user_id: otherUserId
      });

      if (error) throw error;

      setSelectedConversation(conversationId);
      setShowUserSearch(false);
      loadConversations();
      
      toast({
        title: "Conversation started",
        description: `You can now chat with ${otherUser.display_name || otherUser.username}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('user_messages')
        .insert([
          {
            conversation_id: selectedConversation,
            sender_id: user.id,
            content: newMessage,
            message_type: 'text'
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                size="sm"
                variant="ghost"
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                Chat
              </h1>
            </div>
            <Button 
              onClick={() => setShowUserSearch(!showUserSearch)} 
              size="sm"
              variant={showUserSearch ? "secondary" : "default"}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {showUserSearch && (
            <UserSearch onStartConversation={startConversation} />
          )}
        </div>
        
        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="p-2">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`mb-2 cursor-pointer transition-colors ${
                    selectedConversation === conversation.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.other_user?.avatar_url || ''} />
                        <AvatarFallback>
                          {(conversation.other_user?.display_name || conversation.other_user?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.other_user?.display_name || conversation.other_user?.username || 'Unknown User'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedConvData?.other_user?.avatar_url || ''} />
                    <AvatarFallback>
                      {(selectedConvData?.other_user?.display_name || selectedConvData?.other_user?.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      // Open profile modal for the other user
                      if (selectedConvData?.other_user) {
                        // We'll implement this with a profile modal
                      }
                    }}
                  >
                    <h2 className="font-medium">
                      {selectedConvData?.other_user?.display_name || selectedConvData?.other_user?.username || 'Unknown User'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedConvData?.other_user ? (
                    <WebRTCCall 
                      conversationId={selectedConversation}
                      isCallActive={isCallActive}
                      onCallToggle={() => setIsCallActive(!isCallActive)}
                      otherUser={selectedConvData?.other_user}
                    />
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Debug: {selectedConvData?.other_user ? 'User loaded' : 'No user data'}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                      message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <Avatar 
                        className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => {
                          // Open profile for message sender
                          if (message.sender && message.sender_id !== user?.id) {
                            // We'll implement this with a profile modal
                          }
                        }}
                      >
                        <AvatarImage src={message.sender?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {(message.sender?.display_name || message.sender?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender_id === user?.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user?.id 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-border p-4 bg-card">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
              <p className="text-muted-foreground mb-4">
                Select a conversation or start a new one to begin chatting
              </p>
              <Button onClick={() => setShowUserSearch(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
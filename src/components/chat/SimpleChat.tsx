import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSearch } from './UserSearch';
import { WebRTCCall } from './WebRTCCall';
import { UserProfileModal } from './UserProfileModal';

// Admin emails that have access to admin panel
const ADMIN_EMAILS = ['eshaanniranjan460@gmail.com'];

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
  is_admin_message?: boolean;
  sender_is_admin?: boolean;
  created_at: string;
  sender?: User;
  isPending?: boolean; // For optimistic updates
}

// Cache for admin status to avoid repeated RPC calls
const adminCache = new Map<string, boolean>();

// Helper function to check if a user ID belongs to an admin (with caching)
const checkIfAdmin = async (userId: string): Promise<boolean> => {
  if (adminCache.has(userId)) {
    return adminCache.get(userId)!;
  }
  try {
    const { data } = await supabase.rpc('is_admin_email', { _user_id: userId });
    const isAdmin = data === true;
    adminCache.set(userId, isAdmin);
    return isAdmin;
  } catch {
    return false;
  }
};

// Cache for user profiles
const profileCache = new Map<string, User>();

const getCachedProfile = async (userId: string): Promise<User | null> => {
  if (profileCache.has(userId)) {
    return profileCache.get(userId)!;
  }
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) {
      profileCache.set(userId, data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export const SimpleChat: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotificationStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize current user's profile for optimistic updates
  const currentUserProfile = useMemo(() => ({
    id: user?.id || '',
    username: profile?.username || null,
    display_name: profile?.display_name || null,
    avatar_url: profile?.avatar_url || null,
  }), [user?.id, profile]);

  // Pre-cache current user profile
  useEffect(() => {
    if (user?.id && profile) {
      profileCache.set(user.id, currentUserProfile);
    }
  }, [user?.id, profile, currentUserProfile]);

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

  // Instant scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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
            otherUser = await getCachedProfile(otherParticipants[0].user_id);
            console.log('Profile data for user', otherParticipants[0].user_id, ':', otherUser);
            
            if (!otherUser) {
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

      // Get sender info for each message in parallel (using cache)
      const messagesWithSender = await Promise.all(
        (data || []).map(async (msg) => {
          const [senderData, isAdmin] = await Promise.all([
            getCachedProfile(msg.sender_id),
            checkIfAdmin(msg.sender_id)
          ]);

          return {
            ...msg,
            sender: senderData,
            sender_is_admin: isAdmin
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

  const setupRealtimeSubscription = useCallback(() => {
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
          const newMsg = payload.new as Message;
          
          // Skip if this is our own message (we already added it optimistically)
          if (newMsg.sender_id === user?.id) {
            // Update the pending message with real data (remove pending flag)
            setMessages(prev => 
              prev.map(m => 
                m.isPending && m.content === newMsg.content && m.sender_id === newMsg.sender_id
                  ? { ...newMsg, sender: currentUserProfile, sender_is_admin: false, isPending: false }
                  : m
              )
            );
            return;
          }
          
          // For incoming messages from others, add notification immediately
          const senderData = await getCachedProfile(newMsg.sender_id);
          
          addNotification({
            type: 'message',
            title: 'New Message',
            message: `${senderData?.display_name || senderData?.username || 'Someone'}: ${newMsg.content.substring(0, 50)}${newMsg.content.length > 50 ? '...' : ''}`,
            from_user_id: newMsg.sender_id,
            from_username: senderData?.username || 'Unknown',
            conversation_id: selectedConversation || undefined,
          });

          // Check if sender is an admin (using cache)
          const isAdmin = await checkIfAdmin(newMsg.sender_id);

          // Add message to state immediately
          setMessages(prev => [...prev, { ...newMsg, sender: senderData, sender_is_admin: isAdmin }]);
          
          // Update conversation list in background (don't wait)
          setTimeout(() => loadConversations(), 100);
        }
      )
      .subscribe();
  }, [selectedConversation, user?.id, currentUserProfile, addNotification]);

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

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user || isSending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Clear input immediately for instant feedback
    setNewMessage('');
    setIsSending(true);
    
    // Add message optimistically with current user's profile
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation,
      sender_id: user.id,
      content: messageContent,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: currentUserProfile,
      sender_is_admin: false,
      isPending: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { error } = await supabase
        .from('user_messages')
        .insert([
          {
            conversation_id: selectedConversation,
            sender_id: user.id,
            content: messageContent,
            message_type: 'text'
          }
        ]);

      if (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw error;
      }
      
      // The realtime subscription will update the message with real data
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      // Refocus input for continuous typing
      inputRef.current?.focus();
    }
  }, [newMessage, selectedConversation, user, isSending, currentUserProfile, toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleProfileClick = (userId: string) => {
    setSelectedProfileUserId(userId);
    setShowProfileModal(true);
  };

  const handleStartChatFromProfile = async (userId: string) => {
    // Find existing conversation or create new one
    const existingConv = conversations.find(conv => conv.other_user?.id === userId);
    if (existingConv) {
      setSelectedConversation(existingConv.id);
    } else {
      // Start new conversation
      const userData = await getCachedProfile(userId);
      
      if (userData) {
        await startConversation(userId, userData);
      }
    }
  };

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen bg-background flex">
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
                  <div>
                    <h2 className="font-medium">
                      <div 
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          if (selectedConvData?.other_user) {
                            handleProfileClick(selectedConvData.other_user.id);
                          }
                        }}
                      >
                        {selectedConvData?.other_user?.display_name || selectedConvData?.other_user?.username || 'Unknown User'}
                      </div>
                    </h2>
                    <p className="text-xs text-muted-foreground">Online</p>
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
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} ${
                      message.isPending ? 'opacity-70' : ''
                    }`}
                  >
                    <div className={`flex flex-col max-w-xs lg:max-w-md ${
                      message.sender_id === user?.id ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`flex items-end space-x-2 ${
                        message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <Avatar
                          className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => {
                            if (message.sender && message.sender_id !== user?.id) {
                              handleProfileClick(message.sender_id);
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
                            {message.isPending ? 'Sending...' : new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      {message.sender_is_admin && message.sender_id !== user?.id && (
                        <Badge variant="outline" className="mt-1 border-primary bg-primary/10 text-primary">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-border p-4 bg-card">
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending}>
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
      
      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedProfileUserId}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfileUserId(null);
        }}
        onStartChat={handleStartChatFromProfile}
        onStartCall={(userId) => {
          // Handle starting call with specific user
          console.log('Start call with user:', userId);
        }}
      />
    </div>
  );
};

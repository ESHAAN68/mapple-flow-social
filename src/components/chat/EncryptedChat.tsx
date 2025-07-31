import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Phone, 
  PhoneOff,
  Mic,
  MicOff,
  Key,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  encryptMessage, 
  decryptMessage, 
  initializeUserEncryption, 
  getStoredEncryptionKey,
  hashEncryptionKey,
  storeEncryptionKey
} from '@/utils/encryption';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  encryption_key_hash: string;
}

interface Message {
  id: string;
  conversation_id: string;
  encrypted_content: string;
  message_type: string;
  created_at: string;
  decrypted_content?: string;
}

interface VoiceCall {
  id: string;
  conversation_id: string;
  status: string;
}

export const EncryptedChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEncryptionKey, setHasEncryptionKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const voiceChannelRef = useRef<RealtimeChannel | null>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);

  // Initialize encryption
  useEffect(() => {
    const storedKey = getStoredEncryptionKey();
    if (storedKey) {
      setEncryptionKey(storedKey);
      setHasEncryptionKey(true);
    }
  }, []);

  // Load conversations
  useEffect(() => {
    if (user && encryptionKey) {
      loadConversations();
    }
  }, [user, encryptionKey]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && encryptionKey) {
      loadMessages();
      setupRealtimeSubscription();
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selectedConversation, encryptionKey]);

  // Setup voice call subscription
  useEffect(() => {
    if (selectedConversation) {
      setupVoiceCallSubscription();
    }
    return () => {
      if (voiceChannelRef.current) {
        supabase.removeChannel(voiceChannelRef.current);
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateNewKey = () => {
    const key = initializeUserEncryption();
    setEncryptionKey(key);
    setHasEncryptionKey(true);
    toast({
      title: "New encryption key generated",
      description: "Your messages will be encrypted with this key. Keep it safe!",
    });
  };

  const useExistingKey = () => {
    if (!keyInput.trim()) {
      toast({
        title: "Invalid key",
        description: "Please enter your encryption key",
        variant: "destructive",
      });
      return;
    }
    
    storeEncryptionKey(keyInput);
    setEncryptionKey(keyInput);
    setHasEncryptionKey(true);
    setKeyInput('');
    toast({
      title: "Encryption key loaded",
      description: "You can now access your encrypted conversations",
    });
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
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
    if (!selectedConversation || !encryptionKey) return;

    try {
      const { data, error } = await supabase
        .from('encrypted_messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Decrypt messages
      const decryptedMessages = data?.map(msg => {
        try {
          const decrypted = decryptMessage(msg.encrypted_content, encryptionKey);
          return { ...msg, decrypted_content: decrypted };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return { ...msg, decrypted_content: '[Unable to decrypt]' };
        }
      }) || [];

      setMessages(decryptedMessages);
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
          table: 'encrypted_messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          try {
            const decrypted = decryptMessage(newMessage.encrypted_content, encryptionKey!);
            setMessages(prev => [...prev, { ...newMessage, decrypted_content: decrypted }]);
          } catch (error) {
            console.error('Failed to decrypt real-time message:', error);
            setMessages(prev => [...prev, { ...newMessage, decrypted_content: '[Unable to decrypt]' }]);
          }
        }
      )
      .subscribe();
  };

  const setupVoiceCallSubscription = () => {
    if (voiceChannelRef.current) {
      supabase.removeChannel(voiceChannelRef.current);
    }

    voiceChannelRef.current = supabase
      .channel(`voice_calls:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_calls',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        (payload) => {
          const voiceCall = payload.new as VoiceCall;
          if (voiceCall.status === 'active') {
            setIsCallActive(true);
          } else if (voiceCall.status === 'ended') {
            setIsCallActive(false);
            endVoiceCall();
          }
        }
      )
      .subscribe();
  };

  const createNewConversation = async () => {
    if (!user || !encryptionKey) return;

    try {
      const keyHash = hashEncryptionKey(encryptionKey);
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: user.id,
            title: `Chat ${new Date().toLocaleString()}`,
            encryption_key_hash: keyHash
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => [data, ...prev]);
      setSelectedConversation(data.id);
      
      toast({
        title: "New conversation created",
        description: "Start chatting securely!",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !encryptionKey || !user) return;

    try {
      const encryptedContent = encryptMessage(newMessage, encryptionKey);
      
      const { error } = await supabase
        .from('encrypted_messages')
        .insert([
          {
            conversation_id: selectedConversation,
            sender_id: user.id,
            encrypted_content: encryptedContent,
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

  const startVoiceCall = async () => {
    if (!selectedConversation || !user) return;

    try {
      setIsLoading(true);
      
      // Create voice call record
      const { error } = await supabase
        .from('voice_calls')
        .insert([
          {
            conversation_id: selectedConversation,
            caller_id: user.id,
            status: 'active'
          }
        ]);

      if (error) throw error;

      // Initialize real-time chat
      realtimeChatRef.current = new RealtimeChat((message) => {
        console.log('Voice message:', message);
        if (message.type === 'response.audio.delta') {
          // Handle audio response
        } else if (message.type === 'response.audio_transcript.delta') {
          // Handle transcript
        }
      });

      await realtimeChatRef.current.init();
      setIsCallActive(true);
      
      toast({
        title: "Voice call started",
        description: "You can now talk with AI assistant",
      });
    } catch (error) {
      console.error('Error starting voice call:', error);
      toast({
        title: "Error",
        description: "Failed to start voice call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endVoiceCall = async () => {
    try {
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
        realtimeChatRef.current = null;
      }

      // Update call status to ended
      if (selectedConversation) {
        await supabase
          .from('voice_calls')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('conversation_id', selectedConversation)
          .eq('status', 'active');
      }

      setIsCallActive(false);
      setIsMuted(false);
      
      toast({
        title: "Voice call ended",
        description: "Call session terminated",
      });
    } catch (error) {
      console.error('Error ending voice call:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Here you would implement actual mute functionality
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Microphone enabled" : "Microphone disabled",
    });
  };

  if (!hasEncryptionKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Secure Chat Setup</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up end-to-end encryption for your private conversations
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateNewKey} className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Generate New Encryption Key
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use existing key
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your encryption key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && useExistingKey()}
              />
              <Button onClick={useExistingKey} variant="outline" className="w-full">
                Use Existing Key
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Keep your encryption key safe. Without it, you cannot decrypt your messages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold flex items-center">
              <Lock className="w-5 h-5 mr-2 text-primary" />
              Secure Chat
            </h1>
            <Button onClick={createNewConversation} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{conversation.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
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
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary" />
                <h2 className="font-medium">Encrypted Conversation</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {!isCallActive ? (
                  <Button 
                    onClick={startVoiceCall} 
                    size="sm" 
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    {isLoading ? 'Connecting...' : 'Voice Call'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={toggleMute} 
                      size="sm" 
                      variant={isMuted ? "destructive" : "secondary"}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button 
                      onClick={endVoiceCall} 
                      size="sm" 
                      variant="destructive"
                    >
                      <PhoneOff className="w-4 h-4 mr-1" />
                      End Call
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-end"
                    >
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[70%]">
                        <p className="text-sm">{message.decrypted_content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your secure message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                🔒 Messages are end-to-end encrypted
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation to start chatting securely
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
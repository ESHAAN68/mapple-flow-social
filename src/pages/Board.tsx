import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@/components/canvas/FabricCanvas';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CursorOverlay } from '@/components/presence/CursorOverlay';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { usePresenceStore } from '@/store/presenceStore';
import { useToast } from '@/hooks/use-toast';

export default function Board() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, updateUser, removeUser } = usePresenceStore();
  const { toast } = useToast();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    // Load board data
    const loadBoard = async () => {
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Board not found or you don't have access",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setBoard(data);
      setLoading(false);
    };

    loadBoard();

    // Set up real-time presence
    const channel = supabase.channel(`board:${id}`)
      .on('broadcast', { event: 'cursor' }, (payload) => {
        updateUser({
          user_id: payload.payload.user_id,
          username: payload.payload.username,
          cursor_x: payload.payload.x,
          cursor_y: payload.payload.y,
          status: 'active'
        });
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        console.log('Presence sync:', presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        if (leftPresences[0]) {
          removeUser(leftPresences[0].user_id);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track presence
          await channel.track({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User',
            online_at: new Date().toISOString(),
          });
          
          toast({
            title: "Connected",
            description: "Real-time collaboration enabled",
          });
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast({
            title: "Connection Error",
            description: "Failed to connect to real-time features",
            variant: "destructive"
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, navigate, updateUser, removeUser, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Board not found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            Go back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background relative overflow-hidden"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 left-4 z-50 flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="bg-card/80 backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-4 py-2 border border-border">
          <h1 className="font-semibold">{board.title}</h1>
          <p className="text-sm text-muted-foreground">{board.description}</p>
        </div>

        {/* Active users indicator */}
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{users.length + 1}</span>
          {isConnected && (
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        
        {/* Connection status */}
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </motion.div>

      {/* Canvas */}
      <Canvas boardId={id!} />

      {/* Chat Panel */}
      <ChatPanel boardId={id!} />

      {/* Cursor Overlay */}
      <CursorOverlay />
    </motion.div>
  );
}
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@/components/canvas/FabricCanvas';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CursorOverlay } from '@/components/presence/CursorOverlay';
import { BoardSidebar } from '@/components/board/BoardSidebar';
import { ShareModal } from '@/components/board/ShareModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Share, Crown } from 'lucide-react';
import { BoardActions } from '@/components/board/BoardActions';
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
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    // Load board data
    const loadBoard = async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading board:', error);
        toast({
          title: "Error",
          description: "Failed to load board",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      if (!data) {
        toast({
          title: "Not Found",
          description: "Board not found or you don't have access",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      // Get owner profile separately if needed
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', data.owner_id)
        .single();

      setBoard({ ...data, profiles: ownerProfile });
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
        className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">{board.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-3 w-3" />
                  <span>{board.profiles?.username || 'Owner'}</span>
                  {board.is_public && <span>• Public</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active users */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <div className="flex -space-x-2">
                {users.slice(0, 3).map((user, index) => (
                  <div
                    key={user.user_id}
                    className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-background flex items-center justify-center"
                    style={{ zIndex: 10 - index }}
                  >
                    <span className="text-xs text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {users.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-medium">+{users.length - 3}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">{users.length + 1}</span>
              {isConnected && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            
            {/* Action buttons */}
            <BoardActions 
              board={board}
              isOwner={board.owner_id === user?.id}
              onShare={() => setShareModalOpen(true)}
            />
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <BoardSidebar boardId={id!} />
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <Canvas boardId={id!} />
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel boardId={id!} />

      {/* Cursor Overlay */}
      <CursorOverlay />
      
      {/* Share Modal */}
      <ShareModal 
        board={board}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </motion.div>
  );
}
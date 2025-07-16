import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  Mail, 
  UserPlus, 
  Globe, 
  Lock, 
  Eye, 
  Edit, 
  Trash2,
  Settings,
  Crown,
  Shield,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

interface ShareModalProps {
  board: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ board, isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isPublic, setIsPublic] = useState(board?.is_public || false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && board) {
      loadCollaborators();
      setIsPublic(board.is_public);
    }
  }, [isOpen, board]);

  const loadCollaborators = async () => {
    const { data, error } = await supabase
      .from('board_collaborators')
      .select(`
        *,
        profiles(username, avatar_url, display_name)
      `)
      .eq('board_id', board.id);

    if (!error && data) {
      setCollaborators(data);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/board/${board.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
    });
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      // Check if user exists
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', inviteEmail.trim())
        .single();

      if (profileError) {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive"
        });
        return;
      }

      // Add collaborator
      const { error } = await supabase
        .from('board_collaborators')
        .insert({
          board_id: board.id,
          user_id: profiles.id,
          invited_by: user?.id,
          permission: 'edit'
        });

      if (error) {
        toast({
          title: "Failed to invite",
          description: "User may already be a collaborator",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Invitation sent!",
          description: `${inviteEmail} has been added as a collaborator`,
        });
        setInviteEmail('');
        loadCollaborators();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async () => {
    const newPublicState = !isPublic;
    
    const { error } = await supabase
      .from('boards')
      .update({ is_public: newPublicState })
      .eq('id', board.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update board visibility",
        variant: "destructive"
      });
    } else {
      setIsPublic(newPublicState);
      toast({
        title: "Updated!",
        description: `Board is now ${newPublicState ? 'public' : 'private'}`,
      });
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    const { error } = await supabase
      .from('board_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (!error) {
      toast({
        title: "Removed",
        description: "Collaborator has been removed",
      });
      loadCollaborators();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{board?.title}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Share */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Share link</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can {isPublic ? 'view' : 'collaborate'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Input
                value={`${window.location.origin}/board/${board?.id}`}
                readOnly
                className="flex-1"
              />
            </div>
          </div>

          <Separator />

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {isPublic ? 'Public' : 'Private'} board
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? 'Anyone on the internet can view this board'
                  : 'Only invited people can access this board'
                }
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={togglePublic}
            />
          </div>

          <Separator />

          {/* Invite People */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Invite people</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Enter email or username"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && inviteCollaborator()}
                className="flex-1"
              />
              <Button 
                onClick={inviteCollaborator}
                disabled={!inviteEmail.trim() || loading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              People with access ({collaborators.length + 1})
            </Label>
            
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={board?.profiles?.avatar_url} />
                      <AvatarFallback>
                        {board?.profiles?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {board?.profiles?.display_name || board?.profiles?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {board?.profiles?.username}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                </div>

                {/* Collaborators */}
                {collaborators.map((collaborator) => (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collaborator.profiles?.avatar_url} />
                        <AvatarFallback>
                          {collaborator.profiles?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {collaborator.profiles?.display_name || collaborator.profiles?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {collaborator.profiles?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        {collaborator.permission}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeCollaborator(collaborator.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
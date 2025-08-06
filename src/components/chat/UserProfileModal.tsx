import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  MessageCircle, 
  Phone, 
  Star, 
  Shield, 
  Crown,
  Calendar,
  Activity,
  Users,
  BarChart3
} from 'lucide-react';

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
  onStartCall?: (userId: string) => void;
}

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  skills: string[];
  status: string;
  created_at: string;
  last_seen: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onStartChat,
  onStartCall
}) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && isOpen) {
      loadProfile();
      setupRealtimeSubscription();
    }
  }, [userId, isOpen]);

  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-view:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('Profile updated in real-time:', payload);
          const updatedProfile = payload.new as any;
          setProfile(updatedProfile);
          
          toast({
            title: "Profile Updated",
            description: `${updatedProfile.display_name || updatedProfile.username} updated their profile`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      default: return 'Offline';
    }
  };

  if (!profile && !loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-secondary text-white">
                    {profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`absolute bottom-1 right-1 w-5 h-5 ${getStatusColor(profile.status)} rounded-full border-3 border-background`} />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">
                  {profile.display_name || profile.username}
                </h3>
                
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
                
                <Badge variant="outline" className={`${getStatusColor(profile.status)} text-white border-0`}>
                  {getStatusText(profile.status)}
                </Badge>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">About</Label>
                <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Skills & Interests</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">8</p>
                <p className="text-xs text-muted-foreground">Boards</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">3</p>
                <p className="text-xs text-muted-foreground">Teams</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">15</p>
                <p className="text-xs text-muted-foreground">Collaborations</p>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Achievements</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  Top Contributor
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  Team Player
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-purple-500" />
                  Creative Mind
                </Badge>
              </div>
            </div>

            {/* Member since */}
            <div className="text-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  onStartChat?.(profile.id);
                  onClose();
                }}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button 
                onClick={() => {
                  onStartCall?.(profile.id);
                  onClose();
                }}
                variant="outline"
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
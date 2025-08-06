import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Loader2, Camera, Edit3, Save, X, Crown, Shield, Star } from 'lucide-react';

interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  skills: string[];
  status: string;
}

interface ProfileEditorProps {
  userId?: string; // If provided, shows read-only profile view
  isReadOnly?: boolean;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ userId, isReadOnly = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    skills: [],
    status: 'online'
  });
  const [newSkill, setNewSkill] = useState('');
  const [isEditing, setIsEditing] = useState(!isReadOnly);

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId && open) {
      loadProfile();
    }
  }, [targetUserId, open]);

  // Real-time profile updates
  useEffect(() => {
    if (!targetUserId || !open) return;

    const channel = supabase
      .channel(`profile:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          const updatedProfile = payload.new as any;
          setProfile({
            username: updatedProfile.username || '',
            display_name: updatedProfile.display_name || '',
            bio: updatedProfile.bio || '',
            avatar_url: updatedProfile.avatar_url || '',
            skills: updatedProfile.skills || [],
            status: updatedProfile.status || 'offline'
          });
          
          if (!isOwnProfile) {
            toast({
              title: "Profile Updated",
              description: `${updatedProfile.display_name || updatedProfile.username}'s profile was updated`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, open, isOwnProfile, toast]);

  const loadProfile = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setProfile({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          skills: data.skills || [],
          status: data.status || 'offline'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !isOwnProfile) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          skills: profile.skills,
          status: profile.status,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Profile update error:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully! ✨"
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !isOwnProfile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: "Failed to upload avatar. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const newProfile = { ...profile, avatar_url: data.publicUrl };
      setProfile(newProfile);

      // Save to database immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...newProfile,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast({
          title: "Error",
          description: "Avatar uploaded but failed to save to profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Avatar updated! 🎉",
          description: "Your profile picture has been updated",
        });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim() || profile.skills.includes(newSkill.trim())) return;
    
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
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

  const triggerButton = isOwnProfile ? (
    <Button variant="ghost" size="sm" className="gap-2">
      <User className="h-4 w-4" />
      Edit Profile
    </Button>
  ) : (
    <Button variant="ghost" size="sm" className="gap-2">
      <User className="h-4 w-4" />
      View Profile
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isOwnProfile ? 'Edit Profile' : `${profile.display_name || profile.username}'s Profile`}</span>
            {isOwnProfile && (
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {isEditing ? 'Save Mode' : 'Edit Mode'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 overflow-y-auto max-h-[70vh] pr-2"
        >
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                  {profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicator */}
              <div className={`absolute bottom-2 right-2 w-6 h-6 ${getStatusColor(profile.status)} rounded-full border-4 border-background`} />
              
              {isOwnProfile && isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploading}
                  />
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      asChild
                      disabled={uploading}
                      className="rounded-full w-10 h-10 p-0"
                    >
                      <span>
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <h3 className="text-xl font-bold">
                  {profile.display_name || profile.username || 'Unknown User'}
                </h3>
                {isOwnProfile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    You
                  </Badge>
                )}
              </div>
              
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
              
              <Badge variant="outline" className={`${getStatusColor(profile.status)} text-white border-0`}>
                {getStatusText(profile.status)}
              </Badge>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {isEditing && isOwnProfile ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      placeholder="Enter display name"
                      value={profile.display_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={profile.status}
                    onChange={(e) => setProfile(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="away">🟡 Away</option>
                    <option value="busy">🔴 Busy</option>
                    <option value="offline">⚫ Offline</option>
                  </select>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <Label>Skills & Interests</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1"
                    />
                    <Button onClick={addSkill} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Read-only view */}
                <div className="space-y-4">
                  {profile.bio && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">About</Label>
                      <p className="mt-1 text-sm leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {profile.skills.length > 0 && (
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

                  {/* Profile Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">12</p>
                      <p className="text-xs text-muted-foreground">Boards</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">5</p>
                      <p className="text-xs text-muted-foreground">Teams</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent">28</p>
                      <p className="text-xs text-muted-foreground">Collaborations</p>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Achievements</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Early Adopter
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-blue-500" />
                        Collaborator
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-purple-500" />
                        Creator
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    loadProfile(); // Reset changes
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={updateProfile} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
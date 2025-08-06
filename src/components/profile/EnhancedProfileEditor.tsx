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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Upload, Loader2, Camera, Edit3, Save, X, Crown, Shield, Star,
  Palette, Globe, Bell, Eye, EyeOff, Music, Zap, Heart, Coffee,
  Code, Gamepad2, Book, Mountain, Plane, Guitar, Dumbbell, Brush,
  MessageSquare, Settings, Sparkles
} from 'lucide-react';

interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  skills: string[];
  status: string;
  pronouns: string;
  location: string;
  website: string;
  company: string;
  timezone: string;
  theme_color: string;
  profile_banner: string;
  social_links: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    discord?: string;
  };
  privacy_settings: {
    show_email: boolean;
    show_status: boolean;
    allow_messages: boolean;
  };
  custom_status: string;
  badges: string[];
}

const statusOptions = [
  { value: 'online', label: '🟢 Online', color: 'bg-green-500' },
  { value: 'away', label: '🟡 Away', color: 'bg-yellow-500' },
  { value: 'busy', label: '🔴 Busy', color: 'bg-red-500' },
  { value: 'invisible', label: '⚫ Invisible', color: 'bg-gray-500' },
];

const themeColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
];

const skillIcons = {
  'Programming': Code,
  'Design': Brush,
  'Gaming': Gamepad2,
  'Reading': Book,
  'Travel': Plane,
  'Music': Guitar,
  'Fitness': Dumbbell,
  'Art': Palette,
  'Writing': MessageSquare,
  'Photography': Camera,
};

const popularSkills = [
  'Programming', 'Design', 'Photography', 'Writing', 'Music', 'Gaming',
  'Travel', 'Fitness', 'Art', 'Reading', 'Cooking', 'Tech', 'Business',
  'Marketing', 'Data Science', 'UX/UI', 'Project Management'
];

interface EnhancedProfileEditorProps {
  userId?: string;
  isReadOnly?: boolean;
}

export const EnhancedProfileEditor: React.FC<EnhancedProfileEditorProps> = ({ userId, isReadOnly = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    skills: [],
    status: 'online',
    pronouns: '',
    location: '',
    website: '',
    company: '',
    timezone: '',
    theme_color: '#3B82F6',
    profile_banner: '',
    social_links: {},
    privacy_settings: {
      show_email: true,
      show_status: true,
      allow_messages: true
    },
    custom_status: '',
    badges: []
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
          status: data.status || 'online',
          pronouns: (data as any).pronouns || '',
          location: (data as any).location || '',
          website: (data as any).website || '',
          company: (data as any).company || '',
          timezone: (data as any).timezone || '',
          theme_color: (data as any).theme_color || '#3B82F6',
          profile_banner: (data as any).profile_banner || '',
          social_links: (data as any).social_links || {},
          privacy_settings: (data as any).privacy_settings || {
            show_email: true,
            show_status: true,
            allow_messages: true
          },
          custom_status: (data as any).custom_status || '',
          badges: (data as any).badges || []
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
          ...profile,
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

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

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

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));

      toast({
        title: "Avatar updated! 🎉",
        description: "Your profile picture has been updated",
      });
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

  const addSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill.trim();
    if (!skillToAdd || profile.skills.includes(skillToAdd)) return;
    
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, skillToAdd]
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
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500';
  };

  const triggerButton = isOwnProfile ? (
    <Button variant="ghost" size="sm" className="gap-2">
      <Settings className="h-4 w-4" />
      Settings
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isOwnProfile ? 'Profile Settings' : `${profile.display_name || profile.username}'s Profile`}
            </span>
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
        
        <div className="flex gap-6 h-[70vh]">
          {/* Sidebar Navigation */}
          {isEditing && isOwnProfile && (
            <div className="w-48 space-y-2">
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTab('profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeTab === 'appearance' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTab('appearance')}
              >
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </Button>
              <Button
                variant={activeTab === 'privacy' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTab('privacy')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy
              </Button>
              <Button
                variant={activeTab === 'social' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTab('social')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Social
              </Button>
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pr-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback 
                          className="text-2xl text-white"
                          style={{ backgroundColor: profile.theme_color }}
                        >
                          {profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
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

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">
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

                      {profile.custom_status && (
                        <p className="text-sm font-medium" style={{ color: profile.theme_color }}>
                          {profile.custom_status}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="border-0 text-white"
                          style={{ backgroundColor: getStatusColor(profile.status).replace('bg-', '') }}
                        >
                          {statusOptions.find(s => s.value === profile.status)?.label || 'Offline'}
                        </Badge>
                        {profile.pronouns && (
                          <Badge variant="outline">{profile.pronouns}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tab Content */}
              {(!isEditing || !isOwnProfile || activeTab === 'profile') && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="pronouns">Pronouns</Label>
                              <Input
                                id="pronouns"
                                placeholder="e.g., they/them"
                                value={profile.pronouns}
                                onChange={(e) => setProfile(prev => ({ ...prev, pronouns: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="location">Location</Label>
                              <Input
                                id="location"
                                placeholder="City, Country"
                                value={profile.location}
                                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
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
                            <Label htmlFor="custom_status">Custom Status</Label>
                            <Input
                              id="custom_status"
                              placeholder="What's on your mind?"
                              value={profile.custom_status}
                              onChange={(e) => setProfile(prev => ({ ...prev, custom_status: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={profile.status} onValueChange={(value) => setProfile(prev => ({ ...prev, status: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          {profile.bio && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">About</Label>
                              <p className="mt-1 text-sm leading-relaxed">{profile.bio}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {profile.location && (
                              <div>
                                <Label className="text-muted-foreground">Location</Label>
                                <p>{profile.location}</p>
                              </div>
                            )}
                            {profile.company && (
                              <div>
                                <Label className="text-muted-foreground">Company</Label>
                                <p>{profile.company}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Skills & Interests */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Interests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing && isOwnProfile ? (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a skill..."
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                              className="flex-1"
                            />
                            <Button onClick={() => addSkill()} size="sm">
                              Add
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm">Popular Skills</Label>
                            <div className="flex flex-wrap gap-2">
                              {popularSkills.map((skill) => (
                                <Button
                                  key={skill}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addSkill(skill)}
                                  disabled={profile.skills.includes(skill)}
                                  className="h-auto py-1 px-2 text-xs"
                                >
                                  {skillIcons[skill as keyof typeof skillIcons] && 
                                    React.createElement(skillIcons[skill as keyof typeof skillIcons], { className: "h-3 w-3 mr-1" })
                                  }
                                  {skill}
                                </Button>
                              ))}
                            </div>
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
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skillIcons[skill as keyof typeof skillIcons] && 
                                React.createElement(skillIcons[skill as keyof typeof skillIcons], { className: "h-3 w-3 mr-1" })
                              }
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Appearance Tab */}
              {isEditing && isOwnProfile && activeTab === 'appearance' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance & Theme</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Theme Color</Label>
                      <div className="flex gap-2">
                        {themeColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                              profile.theme_color === color ? 'border-foreground scale-110' : 'border-border'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setProfile(prev => ({ ...prev, theme_color: color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Privacy Tab */}
              {isEditing && isOwnProfile && activeTab === 'privacy' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Email</Label>
                        <p className="text-sm text-muted-foreground">Allow others to see your email address</p>
                      </div>
                      <Switch
                        checked={profile.privacy_settings.show_email}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          privacy_settings: { ...prev.privacy_settings, show_email: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Online Status</Label>
                        <p className="text-sm text-muted-foreground">Display when you're online</p>
                      </div>
                      <Switch
                        checked={profile.privacy_settings.show_status}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          privacy_settings: { ...prev.privacy_settings, show_status: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Direct Messages</Label>
                        <p className="text-sm text-muted-foreground">Let others send you direct messages</p>
                      </div>
                      <Switch
                        checked={profile.privacy_settings.allow_messages}
                        onCheckedChange={(checked) => setProfile(prev => ({
                          ...prev,
                          privacy_settings: { ...prev.privacy_settings, allow_messages: checked }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social Tab */}
              {isEditing && isOwnProfile && activeTab === 'social' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          placeholder="GitHub username"
                          value={profile.social_links.github || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, github: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          placeholder="Twitter handle"
                          value={profile.social_links.twitter || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, twitter: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          placeholder="LinkedIn profile"
                          value={profile.social_links.linkedin || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, linkedin: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          placeholder="Your website URL"
                          value={profile.website}
                          onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {isOwnProfile && (
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        loadProfile();
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
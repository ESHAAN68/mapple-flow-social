import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin, useAdminActions } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Shield, 
  Megaphone, 
  Users, 
  AlertTriangle, 
  Ban, 
  Clock, 
  Trash2, 
  CheckCircle,
  Send,
  ArrowLeft
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const { sendAnnouncement, sendWarning, limitUser, banUser, unbanUser, getAllUsers } = useAdminActions();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Announcement form
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'critical'>('info');
  
  // Warning form
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [warningSubject, setWarningSubject] = useState('');
  const [warningContent, setWarningContent] = useState('');
  const [warningType, setWarningType] = useState<'info' | 'warning' | 'final_warning'>('warning');
  
  // Limit form
  const [limitDays, setLimitDays] = useState('7');
  const [limitReason, setLimitReason] = useState('');
  
  // Ban form
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await sendAnnouncement(announcementTitle, announcementContent, announcementType);
      toast.success('Announcement sent to all users!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementType('info');
    } catch (error) {
      console.error('Failed to send announcement:', error);
      toast.error('Failed to send announcement');
    }
  };

  const handleSendWarning = async () => {
    if (!selectedUser || !warningSubject || !warningContent) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await sendWarning(selectedUser, warningSubject, warningContent, warningType);
      toast.success('Warning sent to user!');
      setWarningSubject('');
      setWarningContent('');
    } catch (error) {
      console.error('Failed to send warning:', error);
      toast.error('Failed to send warning');
    }
  };

  const handleLimitUser = async () => {
    if (!selectedUser || !limitReason) {
      toast.error('Please select a user and provide a reason');
      return;
    }
    
    try {
      await limitUser(selectedUser, parseInt(limitDays), limitReason);
      toast.success('User account limited!');
      setLimitReason('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to limit user:', error);
      toast.error('Failed to limit user');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) {
      toast.error('Please select a user and provide a reason');
      return;
    }
    
    try {
      await banUser(selectedUser, banReason);
      toast.success('User banned!');
      setBanReason('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUser(userId);
      toast.success('User unbanned!');
      fetchUsers();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'banned':
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" /> Banned</Badge>;
      case 'limited':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Limited</Badge>;
      default:
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, send announcements, and moderate content</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Announcements
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> User Management
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Moderation
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" /> Send Global Announcement
                </CardTitle>
                <CardDescription>
                  This will be sent as a DM to all users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Write your announcement..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={announcementType} onValueChange={(v: any) => setAnnouncementType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="critical">🚨 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSendAnnouncement} className="w-full">
                  <Send className="h-4 w-4 mr-2" /> Send to All Users
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> All Users ({users.length})
                </CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <span className="text-lg font-semibold">
                                {user.display_name?.[0] || user.username?.[0] || '?'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.display_name || user.username || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(user.user_status || 'active')}
                          {user.user_status === 'banned' && (
                            <Button size="sm" variant="outline" onClick={() => handleUnbanUser(user.id)}>
                              Unban
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Send Warning Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" /> Send Warning
                  </CardTitle>
                  <CardDescription>Send a direct warning message to a user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.display_name || user.username} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={warningSubject}
                    onChange={(e) => setWarningSubject(e.target.value)}
                    placeholder="Subject..."
                  />
                  <Textarea
                    value={warningContent}
                    onChange={(e) => setWarningContent(e.target.value)}
                    placeholder="Warning message..."
                    rows={3}
                  />
                  <Select value={warningType} onValueChange={(v: any) => setWarningType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="final_warning">🚨 Final Warning</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSendWarning} className="w-full" variant="secondary">
                    <Send className="h-4 w-4 mr-2" /> Send Warning
                  </Button>
                </CardContent>
              </Card>

              {/* Limit User Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" /> Limit User
                  </CardTitle>
                  <CardDescription>Temporarily restrict user's access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.user_status !== 'banned').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.display_name || user.username} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={limitDays} onValueChange={setLimitDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={limitReason}
                    onChange={(e) => setLimitReason(e.target.value)}
                    placeholder="Reason for limitation..."
                    rows={2}
                  />
                  <Button onClick={handleLimitUser} className="w-full" variant="secondary">
                    <Clock className="h-4 w-4 mr-2" /> Limit User
                  </Button>
                </CardContent>
              </Card>

              {/* Ban User Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Ban className="h-5 w-5" /> Ban User
                  </CardTitle>
                  <CardDescription>Permanently ban a user from the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.user_status !== 'banned').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.display_name || user.username} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Reason for ban..."
                    />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={!selectedUser || !banReason}>
                        <Ban className="h-4 w-4 mr-2" /> Ban User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Ban</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to ban this user? This action will restrict their access to the platform.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={handleBanUser}>
                          Confirm Ban
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

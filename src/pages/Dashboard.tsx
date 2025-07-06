
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Folder, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Board = Tables<'boards'>;
type Profile = Tables<'profiles'>;

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch user's boards
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('owner_id', user?.id)
        .order('updated_at', { ascending: false });

      if (boardsError) {
        console.error('Error fetching boards:', boardsError);
      } else {
        setBoards(boardsData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewBoard = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            title: 'Untitled Board',
            description: 'A new collaborative workspace',
            owner_id: user?.id,
            canvas_data: {}
          }
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create board",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Board created successfully"
      });

      setBoards(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Mapple Draw
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={createNewBoard} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700">
                  {profile?.display_name || user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {profile?.display_name || 'Creator'}!
          </h2>
          <p className="text-slate-600">
            Ready to collaborate and create something amazing?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Plus className="w-5 h-5 mr-2 text-purple-600" />
                Create Board
              </CardTitle>
              <CardDescription>Start a new collaborative workspace</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Join Team
              </CardTitle>
              <CardDescription>Collaborate with your team</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Folder className="w-5 h-5 mr-2 text-green-600" />
                Browse Templates
              </CardTitle>
              <CardDescription>Get started with templates</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Boards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Your Boards</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          {boards.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Folder className="w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No boards yet</h3>
                <p className="text-slate-600 text-center mb-4">
                  Create your first board to start collaborating
                </p>
                <Button onClick={createNewBoard} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Board
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map((board) => (
                <Card key={board.id} className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{board.title}</CardTitle>
                    <CardDescription>{board.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Updated {new Date(board.updated_at!).toLocaleDateString()}</span>
                      <span>{board.view_count} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

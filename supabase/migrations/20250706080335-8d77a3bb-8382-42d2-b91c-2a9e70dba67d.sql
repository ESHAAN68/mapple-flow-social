
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams/Organizations
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Boards (Canvas workspaces)
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  canvas_data JSONB DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  is_public BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Board collaborators
CREATE TABLE public.board_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'edit',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Real-time chat messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  sender_id UUID REFERENCES auth.users(id),
  board_id UUID REFERENCES public.boards(id),
  team_id UUID REFERENCES public.teams(id),
  parent_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User presence tracking
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  board_id UUID REFERENCES public.boards(id),
  cursor_x FLOAT,
  cursor_y FLOAT,
  status VARCHAR(20) DEFAULT 'active',
  last_active TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, board_id)
);

-- Canvas objects (for granular collaboration)
CREATE TABLE public.canvas_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  object_id VARCHAR(100) NOT NULL,
  object_type VARCHAR(50) NOT NULL,
  object_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_id, object_id)
);

-- Activity feed
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  board_id UUID REFERENCES public.boards(id),
  team_id UUID REFERENCES public.teams(id),
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('board-thumbnails', 'board-thumbnails', true),
  ('chat-attachments', 'chat-attachments', true),
  ('board-templates', 'board-templates', true);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for boards
CREATE POLICY "Public boards are viewable by everyone" ON public.boards
  FOR SELECT USING (is_public = true);

CREATE POLICY "Board owners can do everything" ON public.boards
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Board collaborators can view and edit" ON public.boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.board_collaborators 
      WHERE board_id = id AND user_id = auth.uid()
    )
  );

-- RLS Policies for teams
CREATE POLICY "Team members can view teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage teams" ON public.teams
  FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their boards/teams" ON public.messages
  FOR SELECT USING (
    (board_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.boards b 
      WHERE b.id = board_id AND (
        b.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.board_collaborators bc WHERE bc.board_id = b.id AND bc.user_id = auth.uid())
      )
    )) OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = messages.team_id AND tm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for canvas objects
CREATE POLICY "Canvas objects viewable by board collaborators" ON public.canvas_objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards b 
      WHERE b.id = board_id AND (
        b.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.board_collaborators bc WHERE bc.board_id = b.id AND bc.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Canvas objects manageable by board collaborators" ON public.canvas_objects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.boards b 
      WHERE b.id = board_id AND (
        b.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.board_collaborators bc WHERE bc.board_id = b.id AND bc.user_id = auth.uid())
      )
    )
  );

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Board thumbnails are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'board-thumbnails');

CREATE POLICY "Board owners can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'board-thumbnails');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_objects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

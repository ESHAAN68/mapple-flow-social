-- Fix RLS policies for board access issues

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Board collaborators can view and edit" ON public.boards;
DROP POLICY IF EXISTS "Team members can view teams" ON public.teams;
DROP POLICY IF EXISTS "Canvas objects manageable by board collaborators" ON public.canvas_objects;

-- Fix boards policies
CREATE POLICY "Users can view boards they own or collaborate on" 
ON public.boards 
FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM public.board_collaborators 
    WHERE board_id = boards.id AND user_id = auth.uid()
  )
  OR is_public = true
);

CREATE POLICY "Users can manage boards they own" 
ON public.boards 
FOR ALL 
USING (auth.uid() = owner_id);

-- Enable RLS on missing tables
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for user_presence
CREATE POLICY "Users can manage presence in accessible boards" 
ON public.user_presence 
FOR ALL 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id 
    AND (owner_id = auth.uid() OR is_public = true OR EXISTS (
      SELECT 1 FROM public.board_collaborators 
      WHERE board_id = boards.id AND user_id = auth.uid()
    ))
  )
);

-- Create policies for board_collaborators
CREATE POLICY "Board owners can manage collaborators" 
ON public.board_collaborators 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view collaborators of accessible boards" 
ON public.board_collaborators 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id 
    AND (owner_id = auth.uid() OR is_public = true OR EXISTS (
      SELECT 1 FROM public.board_collaborators bc2
      WHERE bc2.board_id = boards.id AND bc2.user_id = auth.uid()
    ))
  )
);

-- Create policies for team_members
CREATE POLICY "Team owners can manage members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view team members of their teams" 
ON public.team_members 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.team_members tm2 
    WHERE tm2.team_id = team_members.team_id AND tm2.user_id = auth.uid()
  )
);

-- Create policies for activities
CREATE POLICY "Users can view activities for accessible boards" 
ON public.activities 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR (board_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id 
    AND (owner_id = auth.uid() OR is_public = true OR EXISTS (
      SELECT 1 FROM public.board_collaborators 
      WHERE board_id = boards.id AND user_id = auth.uid()
    ))
  ))
);

CREATE POLICY "Users can create activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix teams policy
CREATE POLICY "Users can view teams they belong to" 
ON public.teams 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);

-- Fix canvas objects policy
CREATE POLICY "Users can manage canvas objects in accessible boards" 
ON public.canvas_objects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id 
    AND (owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.board_collaborators 
      WHERE board_id = boards.id AND user_id = auth.uid()
    ))
  )
);
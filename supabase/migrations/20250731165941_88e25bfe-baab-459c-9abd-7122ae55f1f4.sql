-- Clean up and fix all RLS policies

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Board owners can manage collaborators" ON public.board_collaborators;
DROP POLICY IF EXISTS "Users can view collaborators of accessible boards" ON public.board_collaborators;
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can manage presence in accessible boards" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view activities for accessible boards" ON public.activities;
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Users can manage canvas objects in accessible boards" ON public.canvas_objects;
DROP POLICY IF EXISTS "Users can view boards they own or collaborate on" ON public.boards;
DROP POLICY IF EXISTS "Users can manage boards they own" ON public.boards;

-- Enable RLS on all tables
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create simplified and working policies

-- Boards policies
CREATE POLICY "boards_select_policy" 
ON public.boards 
FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM public.board_collaborators 
    WHERE board_id = boards.id AND user_id = auth.uid()
  )
);

CREATE POLICY "boards_all_policy" 
ON public.boards 
FOR ALL 
USING (auth.uid() = owner_id);

-- Board collaborators policies
CREATE POLICY "board_collaborators_all_policy" 
ON public.board_collaborators 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id AND owner_id = auth.uid()
  )
);

-- User presence policies
CREATE POLICY "user_presence_all_policy" 
ON public.user_presence 
FOR ALL 
USING (auth.uid() = user_id);

-- Canvas objects policies
CREATE POLICY "canvas_objects_all_policy" 
ON public.canvas_objects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id AND owner_id = auth.uid()
  )
);

-- Activities policies
CREATE POLICY "activities_select_policy" 
ON public.activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "activities_insert_policy" 
ON public.activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Team members policies
CREATE POLICY "team_members_select_policy" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Messages policies (ensure they work)
DROP POLICY IF EXISTS "Users can view messages in their boards/teams" ON public.messages;
CREATE POLICY "messages_select_policy" 
ON public.messages 
FOR SELECT 
USING (
  (board_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id 
    AND (owner_id = auth.uid() OR is_public = true)
  ))
  OR auth.uid() = sender_id
);
-- Fix RLS policies for missing tables

-- User presence policies
CREATE POLICY "Users can view presence in boards they have access to" 
ON public.user_presence 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM boards b 
    WHERE b.id = user_presence.board_id 
    AND (
      b.owner_id = auth.uid() 
      OR b.is_public = true 
      OR EXISTS (
        SELECT 1 FROM board_collaborators bc 
        WHERE bc.board_id = b.id AND bc.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Board collaborators policies
CREATE POLICY "Board owners can manage collaborators" 
ON public.board_collaborators 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM boards b 
    WHERE b.id = board_collaborators.board_id 
    AND b.owner_id = auth.uid()
  )
);

CREATE POLICY "Collaborators can view other collaborators" 
ON public.board_collaborators 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM boards b 
    WHERE b.id = board_collaborators.board_id 
    AND (
      b.owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM board_collaborators bc 
        WHERE bc.board_id = b.id AND bc.user_id = auth.uid()
      )
    )
  )
);

-- Team members policies
CREATE POLICY "Team owners can manage members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Team members can view other members" 
ON public.team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Activities policies
CREATE POLICY "Users can view activities in boards/teams they have access to" 
ON public.activities 
FOR SELECT 
USING (
  (board_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM boards b 
    WHERE b.id = activities.board_id 
    AND (
      b.owner_id = auth.uid() 
      OR b.is_public = true 
      OR EXISTS (
        SELECT 1 FROM board_collaborators bc 
        WHERE bc.board_id = b.id AND bc.user_id = auth.uid()
      )
    )
  ))
  OR 
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = activities.team_id 
    AND tm.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix the boards policy to include public boards and collaborators
DROP POLICY IF EXISTS "Board collaborators can view and edit" ON public.boards;

CREATE POLICY "Users can view boards they own, collaborate on, or are public" 
ON public.boards 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR is_public = true 
  OR EXISTS (
    SELECT 1 FROM board_collaborators bc 
    WHERE bc.board_id = boards.id AND bc.user_id = auth.uid()
  )
);
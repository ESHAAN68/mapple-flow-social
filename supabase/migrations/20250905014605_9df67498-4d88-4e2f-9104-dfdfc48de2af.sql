-- Fix the security vulnerability in teams table RLS policy
-- The current policy incorrectly references team_members.id instead of teams.id

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Team members can view teams" ON public.teams;

-- Create the corrected policy with proper table reference
CREATE POLICY "Team members can view teams" 
ON public.teams 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.team_members 
    WHERE team_members.team_id = teams.id 
    AND team_members.user_id = auth.uid()
  )
);
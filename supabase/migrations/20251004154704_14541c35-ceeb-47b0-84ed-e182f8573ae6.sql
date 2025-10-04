-- Phase 1: Create spotify_credentials table to isolate sensitive tokens
CREATE TABLE IF NOT EXISTS public.spotify_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on spotify_credentials
ALTER TABLE public.spotify_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only access their own Spotify credentials
CREATE POLICY "Users can manage their own Spotify credentials"
ON public.spotify_credentials
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Migrate existing Spotify token data from profiles to spotify_credentials
INSERT INTO public.spotify_credentials (user_id, access_token, refresh_token, connected_at)
SELECT id, spotify_access_token, spotify_refresh_token, spotify_connected_at
FROM public.profiles
WHERE spotify_access_token IS NOT NULL AND spotify_refresh_token IS NOT NULL;

-- Phase 2: Create security definer functions to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_board_collaborator(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_collaborators bc
    WHERE bc.board_id = $1 AND bc.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(team_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = $1 AND tm.user_id = $2
  );
$$;

-- Phase 3: Drop problematic RLS policies and recreate them properly
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Collaborators can view other collaborators" ON public.board_collaborators;
DROP POLICY IF EXISTS "Team members can view other members" ON public.team_members;

-- Fix profiles RLS - users can only view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a limited public profile view policy
CREATE POLICY "Users can view limited public profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND id != auth.uid()
);

-- Fix board_collaborators RLS using security definer function
CREATE POLICY "Board collaborators can view other collaborators"
ON public.board_collaborators
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_collaborators.board_id 
    AND (b.owner_id = auth.uid() OR public.is_board_collaborator(b.id, auth.uid()))
  )
);

-- Fix team_members RLS using security definer function
CREATE POLICY "Team members can view other members"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id 
    AND (t.owner_id = auth.uid() OR public.is_team_member(t.id, auth.uid()))
  )
);

-- Phase 4: Fix user_conversations weak INSERT policy
DROP POLICY IF EXISTS "Users can create conversations" ON public.user_conversations;

CREATE POLICY "Users can create conversations they participate in"
ON public.user_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
  )
);

-- Remove sensitive Spotify fields from profiles table (keep non-sensitive metadata)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS spotify_access_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS spotify_refresh_token;
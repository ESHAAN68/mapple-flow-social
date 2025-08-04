-- Fix infinite recursion in conversation_participants policy
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Create a simpler policy that allows users to see participants in conversations they're part of
-- This uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_can_view_conversation_participants(conversation_id uuid, requesting_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = $1 AND cp.user_id = $2
  );
$$;

CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
FOR SELECT 
USING (public.user_can_view_conversation_participants(conversation_id, auth.uid()));
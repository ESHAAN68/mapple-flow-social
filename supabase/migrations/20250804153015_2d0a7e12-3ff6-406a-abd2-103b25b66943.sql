-- Fix the function to have proper search path
DROP FUNCTION IF EXISTS public.user_can_view_conversation_participants(uuid, uuid);

CREATE OR REPLACE FUNCTION public.user_can_view_conversation_participants(conversation_id uuid, requesting_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = $1 AND cp.user_id = $2
  );
$$;
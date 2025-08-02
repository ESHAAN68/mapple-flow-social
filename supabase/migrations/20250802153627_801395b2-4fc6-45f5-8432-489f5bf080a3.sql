-- Fix infinite recursion in conversation_participants policy completely
-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert participants in conversations" ON public.conversation_participants;

-- Create a security definer function to check conversation participation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = $1 AND cp.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own participant records" 
ON public.conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert themselves as participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Fix user_conversations policy to avoid recursion
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.user_conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.user_conversations 
FOR SELECT 
USING (public.is_conversation_participant(id, auth.uid()));

-- Fix user_messages policy 
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.user_messages;

CREATE POLICY "Users can view messages in their conversations" 
ON public.user_messages 
FOR SELECT 
USING (public.is_conversation_participant(conversation_id, auth.uid()));
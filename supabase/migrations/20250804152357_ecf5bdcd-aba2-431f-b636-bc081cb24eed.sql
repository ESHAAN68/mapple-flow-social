-- Update RLS policy to allow users to see other participants in conversations they're part of
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);
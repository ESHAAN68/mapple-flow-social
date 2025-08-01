-- Allow users to view all profiles for chat functionality
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix conversation_participants policy to allow creating conversations with others
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON public.conversation_participants;

CREATE POLICY "Users can insert participants in conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  -- User can insert themselves
  user_id = auth.uid() OR 
  -- User can insert others if they're also inserting themselves in the same conversation
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_id 
    AND cp.user_id = auth.uid()
  )
);
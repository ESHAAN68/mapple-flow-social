-- Fix infinite recursion in boards policy
-- Remove problematic policy that references the same table it's applied to
DROP POLICY IF EXISTS "Users can view boards they own, collaborate on, or are public" ON public.boards;

-- Create a security definer function to check if user can access board
CREATE OR REPLACE FUNCTION public.can_user_access_board(board_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.boards b 
    WHERE b.id = board_id AND (
      b.owner_id = user_id OR 
      b.is_public = true OR
      EXISTS (
        SELECT 1 FROM public.board_collaborators bc 
        WHERE bc.board_id = b.id AND bc.user_id = user_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policy using the function
CREATE POLICY "Users can view accessible boards" 
ON public.boards 
FOR SELECT 
USING (public.can_user_access_board(id, auth.uid()));

-- Also fix the user_conversations policy that has similar issue
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.user_conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.user_conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversation_participants cp 
  WHERE cp.conversation_id = user_conversations.id AND cp.user_id = auth.uid()
));

-- Fix the conversation_participants policy that has a recursive reference issue
DROP POLICY IF EXISTS "Users can insert participants in conversations" ON public.conversation_participants;

CREATE POLICY "Users can insert participants in conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Allow creating conversations
CREATE POLICY "Users can create conversations" 
ON public.user_conversations 
FOR INSERT 
WITH CHECK (true);
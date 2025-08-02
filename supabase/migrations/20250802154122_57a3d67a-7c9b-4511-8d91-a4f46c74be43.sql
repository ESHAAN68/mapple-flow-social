-- Create a security definer function to start conversations
CREATE OR REPLACE FUNCTION public.start_conversation(other_user_id uuid)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if current user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if conversation already exists between these users
  SELECT DISTINCT cp1.conversation_id INTO conversation_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = current_user_id 
    AND cp2.user_id = other_user_id
  LIMIT 1;

  -- If conversation exists, return it
  IF conversation_id IS NOT NULL THEN
    RETURN conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.user_conversations DEFAULT VALUES
  RETURNING id INTO conversation_id;

  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (conversation_id, current_user_id),
    (conversation_id, other_user_id);

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;
-- Fix search path security warnings for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_user_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE public.user_conversations 
  SET updated_at = now(), last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';
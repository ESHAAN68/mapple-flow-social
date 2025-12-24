-- Drop existing foreign key constraints and recreate with ON DELETE CASCADE

-- Fix profiles table - drop and recreate foreign key with CASCADE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix boards table - drop and recreate foreign key with CASCADE
ALTER TABLE public.boards DROP CONSTRAINT IF EXISTS boards_owner_id_fkey;
ALTER TABLE public.boards 
  ADD CONSTRAINT boards_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix board_collaborators table - drop and recreate foreign keys with CASCADE
ALTER TABLE public.board_collaborators DROP CONSTRAINT IF EXISTS board_collaborators_user_id_fkey;
ALTER TABLE public.board_collaborators 
  ADD CONSTRAINT board_collaborators_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.board_collaborators DROP CONSTRAINT IF EXISTS board_collaborators_invited_by_fkey;
ALTER TABLE public.board_collaborators 
  ADD CONSTRAINT board_collaborators_invited_by_fkey 
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix other tables that might reference users
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE public.team_members 
  ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_owner_id_fkey;
ALTER TABLE public.teams 
  ADD CONSTRAINT teams_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE public.activities 
  ADD CONSTRAINT activities_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_presence DROP CONSTRAINT IF EXISTS user_presence_user_id_fkey;
ALTER TABLE public.user_presence 
  ADD CONSTRAINT user_presence_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.canvas_objects DROP CONSTRAINT IF EXISTS canvas_objects_created_by_fkey;
ALTER TABLE public.canvas_objects 
  ADD CONSTRAINT canvas_objects_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.spotify_credentials DROP CONSTRAINT IF EXISTS spotify_credentials_user_id_fkey;
ALTER TABLE public.spotify_credentials 
  ADD CONSTRAINT spotify_credentials_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.encrypted_messages DROP CONSTRAINT IF EXISTS encrypted_messages_sender_id_fkey;
ALTER TABLE public.encrypted_messages 
  ADD CONSTRAINT encrypted_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey;
ALTER TABLE public.conversation_participants 
  ADD CONSTRAINT conversation_participants_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_messages DROP CONSTRAINT IF EXISTS user_messages_sender_id_fkey;
ALTER TABLE public.user_messages 
  ADD CONSTRAINT user_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.voice_calls DROP CONSTRAINT IF EXISTS voice_calls_caller_id_fkey;
ALTER TABLE public.voice_calls 
  ADD CONSTRAINT voice_calls_caller_id_fkey 
  FOREIGN KEY (caller_id) REFERENCES auth.users(id) ON DELETE CASCADE;
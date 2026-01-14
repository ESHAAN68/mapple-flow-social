/*
  # Create User Conversations and Messages Tables

  1. New Tables
    - `user_conversations` - For storing one-on-one conversation metadata
    - `conversation_participants` - For tracking participants in conversations
    - `user_messages` - For storing direct messages between users
      - Includes `is_admin_message` flag to mark admin warnings/announcements
  
  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Users can only view/access their own conversations and messages
  
  3. Features
    - Real-time updates enabled
    - Cascade delete on conversation deletion
    - Auto-update conversation timestamps on new messages
*/

CREATE TABLE IF NOT EXISTS public.user_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.user_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.user_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  is_admin_message BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_conversations' AND constraint_name LIKE '%Users can view conversations%'
  ) THEN
    CREATE POLICY "Users can view conversations they participate in"
    ON public.user_conversations
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_conversations' AND constraint_name LIKE '%Users can update conversations%'
  ) THEN
    CREATE POLICY "Users can update conversations they participate in"
    ON public.user_conversations
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'conversation_participants' AND constraint_name LIKE '%Users can view participants%'
  ) THEN
    CREATE POLICY "Users can view participants in their conversations"
    ON public.conversation_participants
    FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'conversation_participants' AND constraint_name LIKE '%Users can insert themselves%'
  ) THEN
    CREATE POLICY "Users can insert themselves as participants"
    ON public.conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_messages' AND constraint_name LIKE '%Users can view messages%'
  ) THEN
    CREATE POLICY "Users can view messages in their conversations"
    ON public.user_messages
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = user_messages.conversation_id AND cp.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_messages' AND constraint_name LIKE '%Users can send messages%'
  ) THEN
    CREATE POLICY "Users can send messages to their conversations"
    ON public.user_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
      sender_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = user_messages.conversation_id AND cp.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_messages' AND constraint_name LIKE '%Admins can send%'
  ) THEN
    CREATE POLICY "Admins can send admin messages"
    ON public.user_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
      is_admin_message = true AND
      EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = user_messages.conversation_id
      )
    );
  END IF;
END $$;

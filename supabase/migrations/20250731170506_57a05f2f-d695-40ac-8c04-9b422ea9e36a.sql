-- Create tables for end-to-end encrypted chat system

-- Create private conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  encryption_key_hash TEXT NOT NULL, -- Hash of user's encryption key for verification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create encrypted messages table
CREATE TABLE public.encrypted_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL, -- AES encrypted message content
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'file')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voice call sessions table for real-time calling
CREATE TABLE public.voice_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'active', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations (only user can access their own conversations)
CREATE POLICY "Users can only access their own conversations" 
ON public.conversations 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for encrypted messages (only sender can access)
CREATE POLICY "Users can only access their own messages" 
ON public.encrypted_messages 
FOR ALL 
USING (auth.uid() = sender_id);

-- RLS policies for voice calls (only caller can access)
CREATE POLICY "Users can only access their own calls" 
ON public.voice_calls 
FOR ALL 
USING (auth.uid() = caller_id);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_encrypted_messages_conversation_id ON public.encrypted_messages(conversation_id);
CREATE INDEX idx_encrypted_messages_created_at ON public.encrypted_messages(created_at DESC);
CREATE INDEX idx_voice_calls_conversation_id ON public.voice_calls(conversation_id);
CREATE INDEX idx_voice_calls_status ON public.voice_calls(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update conversation timestamp when message is added
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.encrypted_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Enable realtime for all tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.encrypted_messages REPLICA IDENTITY FULL;
ALTER TABLE public.voice_calls REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
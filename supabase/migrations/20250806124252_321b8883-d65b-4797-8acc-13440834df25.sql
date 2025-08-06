-- Add new columns to profiles table for enhanced profile system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#3B82F6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_banner TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_email": true, "show_status": true, "allow_messages": true}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Enable realtime for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
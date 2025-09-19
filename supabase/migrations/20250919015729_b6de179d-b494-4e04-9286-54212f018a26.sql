-- Add Spotify integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_user_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spotify_display_name TEXT,
ADD COLUMN IF NOT EXISTS spotify_email TEXT,
ADD COLUMN IF NOT EXISTS spotify_country TEXT,
ADD COLUMN IF NOT EXISTS spotify_premium BOOLEAN DEFAULT false;

-- Create index for faster Spotify user lookups (only if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_spotify_user_id ON public.profiles(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_spotify_connected ON public.profiles(spotify_connected_at) WHERE spotify_connected_at IS NOT NULL;
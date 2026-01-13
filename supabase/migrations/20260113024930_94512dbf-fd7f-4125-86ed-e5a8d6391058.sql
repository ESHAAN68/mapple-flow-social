-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('active', 'limited', 'banned');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_status user_status DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS limited_until timestamp with time zone;

-- Create announcements table for global announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'info',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Create user_announcements junction table to track which users received which announcements
CREATE TABLE public.user_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, announcement_id)
);

-- Create admin_messages table for direct admin messages to users
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'info',
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin_email(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  admin_emails text[] := ARRAY['eshaanniranjan460@gmail.com'];
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = _user_id;
  RETURN user_email = ANY(admin_emails);
END;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin_email(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin_email(auth.uid()));

-- RLS Policies for announcements
CREATE POLICY "Anyone can view announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (public.is_admin_email(auth.uid()));

-- RLS Policies for user_announcements
CREATE POLICY "Users can view their announcements"
ON public.user_announcements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their announcements"
ON public.user_announcements FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user_announcements"
ON public.user_announcements FOR ALL
USING (public.is_admin_email(auth.uid()));

-- RLS Policies for admin_messages
CREATE POLICY "Users can view their admin messages"
ON public.admin_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their admin messages"
ON public.admin_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage admin messages"
ON public.admin_messages FOR ALL
USING (public.is_admin_email(auth.uid()));

-- Allow admins to update any profile (for ban/limit actions)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin_email(auth.uid()));
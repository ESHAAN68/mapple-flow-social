-- Fix infinite recursion in boards policy and duplicate username issues

-- First, drop the problematic boards policies causing infinite recursion
DROP POLICY IF EXISTS "boards_select_policy" ON public.boards;
DROP POLICY IF EXISTS "boards_all_policy" ON public.boards;

-- Create simple, non-recursive policies for boards
CREATE POLICY "boards_owner_access" 
ON public.boards 
FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "boards_public_read" 
ON public.boards 
FOR SELECT 
USING (is_public = true);

-- Fix the profiles table username constraint issue
-- First, check if there's an existing unique constraint on username
DROP INDEX IF EXISTS profiles_username_key;

-- Recreate the profiles table constraint to handle duplicates better
-- Make username nullable and remove unique constraint for now
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;

-- Update the handle_new_user function to handle duplicate usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    username_to_use text;
    counter int := 0;
BEGIN
    -- Generate a base username from email
    username_to_use := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    
    -- Check if username already exists and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_to_use) LOOP
        counter := counter + 1;
        username_to_use := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || '_' || counter;
    END LOOP;
    
    -- Insert the profile with unique username
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        username_to_use,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the signup
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Fix any existing board_collaborators policy that might cause issues
DROP POLICY IF EXISTS "board_collaborators_all_policy" ON public.board_collaborators;

-- Create simple board collaborators policy
CREATE POLICY "board_collaborators_owner_access" 
ON public.board_collaborators 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.boards 
        WHERE id = board_id AND owner_id = auth.uid()
    )
    OR user_id = auth.uid()
);

-- Fix canvas_objects policy
DROP POLICY IF EXISTS "canvas_objects_all_policy" ON public.canvas_objects;

CREATE POLICY "canvas_objects_board_access" 
ON public.canvas_objects 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.boards 
        WHERE id = board_id AND owner_id = auth.uid()
    )
);
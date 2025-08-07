/*
  # Add Premium Features and Analytics

  1. New Columns
    - Add premium subscription fields to profiles table
    - Add analytics tracking fields
    - Add storage usage tracking

  2. Security
    - Enable RLS on new tables
    - Add policies for premium features

  3. Functions
    - Add function to check premium status
    - Add function to calculate storage usage
*/

-- Add premium subscription fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'premium_plan'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN premium_plan TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'premium_expires_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'storage_used'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN storage_used BIGINT DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'storage_limit'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN storage_limit BIGINT DEFAULT 104857600; -- 100MB in bytes
  END IF;
END $$;

-- Create analytics tracking table
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  date_recorded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, metric_name, date_recorded)
);

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  plan_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_analytics
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" 
ON public.user_analytics 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for payment_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to check if user has premium
CREATE OR REPLACE FUNCTION public.is_premium_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND premium_plan IS NOT NULL 
    AND (premium_expires_at IS NULL OR premium_expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Function to get storage limit based on premium status
CREATE OR REPLACE FUNCTION public.get_storage_limit(user_id UUID)
RETURNS BIGINT AS $$
BEGIN
  IF public.is_premium_user(user_id) THEN
    RETURN 10737418240; -- 10GB for premium users
  ELSE
    RETURN 104857600; -- 100MB for free users
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Function to update analytics metrics
CREATE OR REPLACE FUNCTION public.update_user_metric(
  user_id UUID,
  metric_name TEXT,
  increment_by BIGINT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_analytics (user_id, metric_name, metric_value, date_recorded)
  VALUES (user_id, metric_name, increment_by, CURRENT_DATE)
  ON CONFLICT (user_id, metric_name, date_recorded)
  DO UPDATE SET 
    metric_value = user_analytics.metric_value + increment_by,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to update storage limit when premium status changes
CREATE OR REPLACE FUNCTION public.update_storage_limit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.storage_limit := public.get_storage_limit(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER update_profile_storage_limit
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.premium_plan IS DISTINCT FROM NEW.premium_plan OR OLD.premium_expires_at IS DISTINCT FROM NEW.premium_expires_at)
  EXECUTE FUNCTION public.update_storage_limit();

-- Enable realtime for new tables
ALTER TABLE public.user_analytics REPLICA IDENTITY FULL;
ALTER TABLE public.payment_transactions REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
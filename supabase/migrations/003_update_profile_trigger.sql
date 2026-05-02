-- ============================================================
-- Migration 003: Update Profile Trigger
-- Ensures new users get has_onboarded = false by default
-- ============================================================

-- Update the trigger function to set has_onboarded = false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, has_onboarded)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), false);
  RETURN NEW;
END;
$$;
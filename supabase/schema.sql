-- ============================================================
-- Crivox  Consolidated Schema
-- ============================================================

-- comment_history
CREATE TABLE IF NOT EXISTS public.comment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('url', 'text', 'image')),
  input_content TEXT,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  length TEXT NOT NULL,
  generated_comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own history" ON public.comment_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON public.comment_history;
DROP POLICY IF EXISTS "Users can update their own history" ON public.comment_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON public.comment_history;

CREATE POLICY "Users can view their own history" ON public.comment_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history" ON public.comment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own history" ON public.comment_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own history" ON public.comment_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comment_history_user_id ON public.comment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_created_at ON public.comment_history(created_at DESC);

-- comment_templates
CREATE TABLE IF NOT EXISTS public.comment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own templates" ON public.comment_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.comment_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.comment_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.comment_templates;

CREATE POLICY "Users can view their own templates" ON public.comment_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own templates" ON public.comment_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.comment_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.comment_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- shared_comments
CREATE TABLE IF NOT EXISTS public.shared_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  share_slug TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  post_summary TEXT,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  tone TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own shares" ON public.shared_comments;
DROP POLICY IF EXISTS "Users can view their own shares" ON public.shared_comments;
DROP POLICY IF EXISTS "Anyone can view shared comments" ON public.shared_comments;
DROP POLICY IF EXISTS "Users can delete their own shares" ON public.shared_comments;

CREATE POLICY "Users can insert their own shares" ON public.shared_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own shares" ON public.shared_comments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared comments" ON public.shared_comments
  FOR SELECT TO anon USING (true);
CREATE POLICY "Users can delete their own shares" ON public.shared_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  default_tone TEXT DEFAULT 'Professional',
  default_platform TEXT DEFAULT 'LinkedIn',
  default_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- comment_queue
CREATE TABLE IF NOT EXISTS public.comment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  notes TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.comment_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queue" ON public.comment_queue;
DROP POLICY IF EXISTS "Users can insert own queue" ON public.comment_queue;
DROP POLICY IF EXISTS "Users can update own queue" ON public.comment_queue;
DROP POLICY IF EXISTS "Users can delete own queue" ON public.comment_queue;

CREATE POLICY "Users can view own queue" ON public.comment_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue" ON public.comment_queue
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue" ON public.comment_queue
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue" ON public.comment_queue
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_templates_user_id ON public.comment_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_templates_created_at ON public.comment_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_queue_user_id ON public.comment_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_queue_scheduled_date ON public.comment_queue(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_comments_share_slug ON public.shared_comments(share_slug);

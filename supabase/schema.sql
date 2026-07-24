-- ============================================================
-- Crivox — Complete Schema (idempotent, safe to re-run)
-- ============================================================

-- ── comment_history ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comment_history (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_type         TEXT        NOT NULL CHECK (input_type IN ('url', 'text', 'image')),
  input_content      TEXT,
  platform           TEXT        NOT NULL,
  tone               TEXT        NOT NULL,
  length             TEXT        NOT NULL,
  generated_comments JSONB       NOT NULL DEFAULT '[]',
  is_favorite        BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own history"   ON public.comment_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON public.comment_history;
DROP POLICY IF EXISTS "Users can update their own history" ON public.comment_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON public.comment_history;

CREATE POLICY "Users can view their own history"   ON public.comment_history FOR SELECT            USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history" ON public.comment_history FOR INSERT            WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own history" ON public.comment_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own history" ON public.comment_history FOR DELETE            USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comment_history_user_id    ON public.comment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_created_at ON public.comment_history(created_at DESC);

-- ── comment_templates ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comment_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  is_preset  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own templates"   ON public.comment_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.comment_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.comment_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.comment_templates;

CREATE POLICY "Users can view their own templates"   ON public.comment_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own templates" ON public.comment_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.comment_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.comment_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comment_templates_user_id    ON public.comment_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_templates_created_at ON public.comment_templates(created_at DESC);

-- ── shared_comments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_slug   TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  post_summary TEXT,
  comments     JSONB       NOT NULL DEFAULT '[]',
  tone         TEXT        NOT NULL,
  platform     TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own shares" ON public.shared_comments;
DROP POLICY IF EXISTS "Users can view their own shares"   ON public.shared_comments;
DROP POLICY IF EXISTS "Anyone can view shared comments"   ON public.shared_comments;
DROP POLICY IF EXISTS "Users can delete their own shares" ON public.shared_comments;

CREATE POLICY "Users can insert their own shares" ON public.shared_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own shares"   ON public.shared_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared comments"   ON public.shared_comments FOR SELECT            USING (true);
CREATE POLICY "Users can delete their own shares" ON public.shared_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shared_comments_share_slug ON public.shared_comments(share_slug);

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT,
  avatar_url       TEXT,
  default_tone     TEXT        DEFAULT 'Professional',
  default_platform TEXT        DEFAULT 'LinkedIn',
  default_language TEXT        DEFAULT 'en',
  full_name        TEXT,
  profession       TEXT,
  industry         TEXT,
  target_audience  TEXT,
  use_case         TEXT,
  has_onboarded    BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ── comment_queue ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comment_queue (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text   TEXT        NOT NULL,
  platform       TEXT        NOT NULL,
  tone           TEXT        NOT NULL,
  notes          TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  status         TEXT        NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ
);

ALTER TABLE public.comment_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queue"   ON public.comment_queue;
DROP POLICY IF EXISTS "Users can insert own queue" ON public.comment_queue;
DROP POLICY IF EXISTS "Users can update own queue" ON public.comment_queue;
DROP POLICY IF EXISTS "Users can delete own queue" ON public.comment_queue;

CREATE POLICY "Users can view own queue"   ON public.comment_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue" ON public.comment_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue" ON public.comment_queue FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue" ON public.comment_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comment_queue_user_id        ON public.comment_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_queue_scheduled_date ON public.comment_queue(scheduled_date);

-- ── voice_samples ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.voice_samples (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own voice samples"   ON public.voice_samples;
DROP POLICY IF EXISTS "Users can insert own voice samples" ON public.voice_samples;
DROP POLICY IF EXISTS "Users can delete own voice samples" ON public.voice_samples;

CREATE POLICY "Users can view own voice samples"   ON public.voice_samples FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice samples" ON public.voice_samples FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice samples" ON public.voice_samples FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON public.voice_samples(user_id);

-- ── rate_limits ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count        INTEGER     NOT NULL DEFAULT 1
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rate limit"  ON public.rate_limits;
DROP POLICY IF EXISTS "Users can insert own rate limit" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can update own rate limit" ON public.rate_limits;

CREATE POLICY "Users can view own rate limit"  ON public.rate_limits FOR SELECT   TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rate limit" ON public.rate_limits FOR INSERT   TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rate limit" ON public.rate_limits FOR UPDATE   TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);

-- ── subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  plan                  TEXT        NOT NULL DEFAULT 'free',
  status                TEXT        NOT NULL DEFAULT 'active',
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Functions & Triggers ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at     ON public.profiles;
DROP TRIGGER IF EXISTS set_comment_queue_updated_at ON public.comment_queue;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_comment_queue_updated_at
  BEFORE UPDATE ON public.comment_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, has_onboarded)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.comment_history   WHERE user_id = uid;
  DELETE FROM public.comment_templates WHERE user_id = uid;
  DELETE FROM public.shared_comments   WHERE user_id = uid;
  DELETE FROM public.comment_queue     WHERE user_id = uid;
  DELETE FROM public.profiles          WHERE user_id = uid;
  DELETE FROM auth.users               WHERE id = uid;
END;
$$;

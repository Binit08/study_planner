-- Migration: 20261108000000_create_study_tables.sql
-- Description: Core schema for Study Assistant: study_sets, flashcard_progress, quiz_attempts, checklist_items
-- Constraints, cascading deletion, foreign keys, indexes, and updated_at triggers included.

-- Note: gen_random_uuid() is built into PostgreSQL 13+ (no public extension required).

-- 1. study_sets table
CREATE TABLE IF NOT EXISTS public.study_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT,
  source_type TEXT NOT NULL DEFAULT 'text' CHECK (source_type IN ('text', 'pdf')),
  source_preview TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('flashcards', 'quiz', 'both')),
  flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. flashcard_progress table
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  card_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unseen' CHECK (status IN ('unseen', 'learning', 'mastered')),
  last_reviewed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_study_set_card UNIQUE (study_set_id, card_index)
);

-- 3. quiz_attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. checklist_items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID REFERENCES public.study_sets(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sets_created_at ON public.study_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_set ON public.flashcard_progress(study_set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_set ON public.quiz_attempts(study_set_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_set ON public.checklist_items(study_set_id);

-- Trigger function for updated_at timestamps (immutable search_path for Supabase Security Advisor)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now());
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_study_sets_updated_at ON public.study_sets;
CREATE TRIGGER trigger_study_sets_updated_at
  BEFORE UPDATE ON public.study_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_flashcard_progress_updated_at ON public.flashcard_progress;
CREATE TRIGGER trigger_flashcard_progress_updated_at
  BEFORE UPDATE ON public.flashcard_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_checklist_items_updated_at ON public.checklist_items;
CREATE TRIGGER trigger_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS) on all tables without public/anon policies.
-- Server-side Route Handlers will access via the SUPABASE_SERVICE_ROLE_KEY.
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Notice on RLS: In this single-user demo setup without public user auth,
-- all queries are routed through server Route Handlers using the Service Role key.
-- For multi-user setups, add auth.uid() owner policies here.


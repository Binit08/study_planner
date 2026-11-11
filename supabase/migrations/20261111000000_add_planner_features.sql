-- Migration: 20261111000000_add_planner_features.sql
-- Description: Adds study planner scheduling fields, SM-2 spaced repetition columns,
--              study_goals (exam countdowns), and study_sessions (focus timer logs).

-- 1. Enhance checklist_items with scheduling, priority, and duration fields
ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER NOT NULL DEFAULT 20 CHECK (estimated_minutes > 0 AND estimated_minutes <= 480),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_checklist_items_scheduled ON public.checklist_items(scheduled_date, completed);

-- 2. Enhance flashcard_progress with SM-2 spaced repetition fields
ALTER TABLE public.flashcard_progress
  ADD COLUMN IF NOT EXISTS ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS interval_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repetitions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_flashcard_progress_next_review ON public.flashcard_progress(next_review_at);

-- 3. study_goals table (exams, deadlines, and target study plans)
CREATE TABLE IF NOT EXISTS public.study_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General',
  study_set_id UUID REFERENCES public.study_sets(id) ON DELETE SET NULL,
  exam_date DATE NOT NULL,
  daily_minutes INTEGER NOT NULL DEFAULT 30 CHECK (daily_minutes > 0 AND daily_minutes <= 600),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_goals_exam_date ON public.study_goals(exam_date ASC);
CREATE INDEX IF NOT EXISTS idx_study_goals_study_set ON public.study_goals(study_set_id);

DROP TRIGGER IF EXISTS trigger_study_goals_updated_at ON public.study_goals;
CREATE TRIGGER trigger_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

-- 4. study_sessions table (focus timer & study logs for streaks and analytics)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID REFERENCES public.study_sets(id) ON DELETE SET NULL,
  topic TEXT NOT NULL DEFAULT 'General',
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  activity_type TEXT NOT NULL DEFAULT 'focus' CHECK (activity_type IN ('focus', 'flashcards', 'quiz', 'review')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_completed_at ON public.study_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_study_set ON public.study_sessions(study_set_id);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;


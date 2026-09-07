-- Practice Engine Phase 3: real adaptive 30-Day Runway, outcome reporting.
-- Fully additive. Run in the Supabase SQL editor (schema applied manually).

-- Per-user runway state — one row per user. day_index/current_phase are always
-- recomputed live from plan_started_at/exam_date/now (see lib/runway.ts) rather than
-- trusted as stored truth; these columns exist so the phase a user is shown is stable
-- within a day and so daily_plan_items can be keyed to a concrete phase.
CREATE TABLE IF NOT EXISTS public.study_plan_state (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  exam_date DATE,
  plan_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_phase TEXT NOT NULL DEFAULT 'diagnose'
    CHECK (current_phase IN ('diagnose', 'build', 'apply', 'transfer', 'simulate', 'remediate', 'prove_it')),
  compressed BOOLEAN NOT NULL DEFAULT false,
  day_index INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.study_plan_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_plan_state_own" ON public.study_plan_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "study_plan_state_service_all" ON public.study_plan_state FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.study_plan_state TO service_role;

-- The concrete recommended session for one user on one day — generated on demand
-- (see api/runway/route.ts) and cached here so revisiting the same day doesn't
-- recompute or drift, and so "completed" can be tracked.
CREATE TABLE IF NOT EXISTS public.daily_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  phase TEXT NOT NULL,
  mode TEXT NOT NULL, -- 'learn' | 'practice' | 'transfer' | 'weakness' | 'exam'
  concept_ids UUID[] NOT NULL DEFAULT '{}',
  target_cognitive_level TEXT,
  estimated_minutes INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_items_user_date ON public.daily_plan_items(user_id, plan_date);

ALTER TABLE public.daily_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_plan_items_own" ON public.daily_plan_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_plan_items_service_all" ON public.daily_plan_items FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.daily_plan_items TO service_role;

-- Voluntary self-reported real FAA outcome — collection only. Not used for any
-- predictive claim yet (the product spec explicitly forbids a pass-probability claim
-- until this data exists in volume); this table starts gathering the ground truth a
-- future validated model would need.
CREATE TABLE IF NOT EXISTS public.exam_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('ppl', 'ifr')),
  real_exam_date DATE,
  passed BOOLEAN,
  score INTEGER,
  comparison_difficulty TEXT CHECK (comparison_difficulty IN ('easier', 'about_same', 'harder')),
  questions_familiarity TEXT CHECK (questions_familiarity IN ('mostly', 'somewhat', 'not_really')),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_outcomes_user_id ON public.exam_outcomes(user_id);

ALTER TABLE public.exam_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_outcomes_own" ON public.exam_outcomes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "exam_outcomes_service_all" ON public.exam_outcomes FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.exam_outcomes TO service_role;

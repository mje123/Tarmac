-- Question-engine foundation: concept/source layer + validated generation pipeline
-- Additive only — does not modify any existing column, table, or constraint.
-- Run in the Supabase SQL editor (this repo's schema is applied manually; see supabase-schema.sql).

-- 1. Concepts — the authoritative knowledge layer. The LLM generates FROM these rows;
--    it is never the source of the rule itself.
CREATE TABLE IF NOT EXISTS public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- stable key matching src/lib/generation/concepts.ts ConceptSlug
  exam_type TEXT NOT NULL CHECK (exam_type IN ('ppl', 'ifr')),
  acs_area TEXT NOT NULL,
  acs_task TEXT,
  category TEXT NOT NULL, -- maps to the existing questions.category value for this concept
  name TEXT NOT NULL,
  authoritative_source TEXT NOT NULL, -- e.g. "14 CFR 91.155", "FAA-H-8083-25C Ch. 10"
  rule_summary TEXT NOT NULL,         -- verified, human-reviewed statement of the rule/fact
  common_misconceptions TEXT,
  variables JSONB NOT NULL DEFAULT '[]', -- e.g. ["field_elevation", "temperature", "aircraft_weight"]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Question archetypes — the cognitive "shapes" a concept can be tested in
--    (calculation, comparison, scenario, operational decision, etc).
CREATE TABLE IF NOT EXISTS public.question_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL,   -- e.g. "calculation", "comparison", "operational_decision"
  cognitive_level TEXT NOT NULL CHECK (cognitive_level IN ('recall', 'application', 'scenario', 'multi_concept', 'transfer')),
  template_prompt TEXT NOT NULL, -- instructions the generator receives alongside the concept's rule_summary
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Extend `questions` additively so legacy rows (concept_id IS NULL) are untouched
--    and every existing query against `questions` keeps working unmodified.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archetype_id UUID REFERENCES public.question_archetypes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cognitive_level TEXT,
  ADD COLUMN IF NOT EXISTS scenario_type TEXT,
  ADD COLUMN IF NOT EXISTS distractor_rationale TEXT,
  ADD COLUMN IF NOT EXISTS common_trap TEXT,
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'legacy'
    CHECK (validation_status IN ('legacy', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS validation_log JSONB,
  ADD COLUMN IF NOT EXISTS novelty_key TEXT;

-- Existing rows (the one-shot-generated bank) are explicitly 'legacy', not 'approved' —
-- they were never run through the new validation pipeline and should be labeled honestly.
UPDATE public.questions SET validation_status = 'legacy' WHERE validation_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_questions_concept_id ON public.questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_questions_validation_status ON public.questions(validation_status);

-- 4. Generation log — every attempt, including rejected ones, for admin visibility.
CREATE TABLE IF NOT EXISTS public.question_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
  archetype_id UUID REFERENCES public.question_archetypes(id) ON DELETE SET NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL, -- set only if approved
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  raw_output JSONB,
  validation_result TEXT NOT NULL CHECK (validation_result IN ('approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_log_concept_id ON public.question_generation_log(concept_id);

-- 5. Concept-level mastery — additive alongside (not replacing) user_progress's
--    category-level rollup, so nothing currently reading user_progress breaks.
CREATE TABLE IF NOT EXISTS public.concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  novel_attempts INTEGER NOT NULL DEFAULT 0,
  novel_correct INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_id ON public.concept_mastery(user_id);

-- RLS
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concepts_auth_read" ON public.concepts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "concepts_service_all" ON public.concepts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "archetypes_auth_read" ON public.question_archetypes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "archetypes_service_all" ON public.question_archetypes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Generation log is admin/service visibility only — not exposed to students.
CREATE POLICY "generation_log_service_all" ON public.question_generation_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "generation_log_admin_read" ON public.question_generation_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "concept_mastery_own" ON public.concept_mastery FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "concept_mastery_service_all" ON public.concept_mastery FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.concepts, public.question_archetypes, public.question_generation_log, public.concept_mastery TO service_role;

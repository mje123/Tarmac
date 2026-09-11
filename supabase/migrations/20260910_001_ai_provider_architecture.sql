-- Phase 5: provider-agnostic AI generation architecture.
-- Additive only — no existing column, table, row, or constraint is narrowed or dropped
-- (the validation_status CHECK is widened, not replaced with a smaller set: every value
-- it already allowed still passes). Run manually in the Supabase SQL editor / via psql,
-- same as the other files in this directory (see question_engine_foundation.sql).

-- 1. Blueprint/provenance fields on `questions`, for the richer structured schema the
--    provider-agnostic generator produces. All nullable/defaulted so every existing
--    row (legacy + the current concept pipeline's rows) stays valid untouched.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS source_reference TEXT,          -- specific citation, e.g. "14 CFR 91.185(c)(2)" (concept.authoritative_source is the broader source)
  ADD COLUMN IF NOT EXISTS figure_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS figure_type TEXT,                -- e.g. "sectional_excerpt", "approach_plate"
  ADD COLUMN IF NOT EXISTS figure_source TEXT,              -- e.g. "FAA-CT-8080-3F Figure 12" — never a fabricated chart
  ADD COLUMN IF NOT EXISTS visual_concept TEXT,             -- what the (future) figure would need to show
  ADD COLUMN IF NOT EXISTS variables_used JSONB,            -- which of concept.variables this specific question instantiated
  ADD COLUMN IF NOT EXISTS generation_mode TEXT
    CHECK (generation_mode IN ('new_question', 'novel_variant', 'prove_it', 'weakness_attack', 'transfer')),
  ADD COLUMN IF NOT EXISTS provider TEXT,                   -- 'openai' | 'gemini' | 'anthropic'
  ADD COLUMN IF NOT EXISTS model_version TEXT;

-- Widen validation_status: keep every value it already accepted (legacy/pending/
-- approved/rejected) and add the pipeline states the spec calls for. A question must
-- pass through 'generated' -> 'validating' -> ('approved' | 'rejected' | 'needs_review')
-- -> optionally 'retired' later; nothing here changes what any existing row currently is.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_validation_status_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_validation_status_check
  CHECK (validation_status IN ('legacy', 'pending', 'approved', 'rejected', 'generated', 'validating', 'needs_review', 'retired'));

CREATE INDEX IF NOT EXISTS idx_questions_provider ON public.questions(provider);
CREATE INDEX IF NOT EXISTS idx_questions_generation_mode ON public.questions(generation_mode);

-- 2. Generation log gets full per-attempt observability: which provider/model produced
--    the attempt, how long it took, what it cost, the exact blueprint it was given, and
--    the structured semantic-validation breakdown (not just a pass/fail reason string).
ALTER TABLE public.question_generation_log
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS model_version TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS blueprint JSONB,
  ADD COLUMN IF NOT EXISTS semantic_validation JSONB,
  ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,6);

CREATE INDEX IF NOT EXISTS idx_generation_log_provider ON public.question_generation_log(provider);

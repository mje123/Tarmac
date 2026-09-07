-- Practice Engine Phase 1: makes the adaptive loop real using data already being
-- collected. Fully additive — no existing column, table, constraint, or row is
-- dropped. Run in the Supabase SQL editor (this repo's schema is applied manually;
-- see supabase-schema.sql).

-- 1. Widen the error-tag taxonomy from 3 to 9 categories. Existing values
--    ('concept_gap', 'calculation_error', 'distractor_trap') are kept verbatim (not
--    renamed) so no existing test_answers row is invalidated by the new constraint.
ALTER TABLE public.test_answers DROP CONSTRAINT IF EXISTS test_answers_error_tag_check;
ALTER TABLE public.test_answers
  ADD CONSTRAINT test_answers_error_tag_check CHECK (error_tag IN (
    'concept_gap', 'calculation_error', 'distractor_trap', 'regulation_confusion',
    'careless_error', 'confidence_error', 'figure_misread', 'misread_question', 'transfer_failure'
  ));

DO $$ BEGIN
  ALTER TABLE public.test_answers
    ADD COLUMN IF NOT EXISTS error_tag_source TEXT CHECK (error_tag_source IN ('heuristic', 'ai'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.test_answers.error_tag_source IS 'Whether error_tag came from the cheap rule-based heuristic (classifyError) or the async Haiku refinement pass for the concept_gap residual bucket. Null when error_tag is null.';

-- 2. Reliable queue for the async error-classification refinement pass. A row here is
--    processed by a cron job (api/cron/classify-errors), not an in-request
--    fire-and-forget promise, so a serverless function terminating mid-request can
--    never silently drop a classification.
CREATE TABLE IF NOT EXISTS public.pending_error_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_answer_id UUID NOT NULL REFERENCES public.test_answers(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_error_classifications_unprocessed
  ON public.pending_error_classifications(created_at) WHERE processed_at IS NULL;

ALTER TABLE public.pending_error_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pending_error_classifications_service_all" ON public.pending_error_classifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.pending_error_classifications TO service_role;

-- 3. Reserved extension points for the future graphics/vision engine phase. Nullable,
--    additive, and deliberately unused by any logic in this phase — just reserving the
--    shape so that phase doesn't require a breaking migration on `questions` later.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS figure_id TEXT,
  ADD COLUMN IF NOT EXISTS figure_type TEXT,
  ADD COLUMN IF NOT EXISTS figure_source TEXT,
  ADD COLUMN IF NOT EXISTS figure_version TEXT,
  ADD COLUMN IF NOT EXISTS figure_metadata JSONB,
  ADD COLUMN IF NOT EXISTS visual_concept TEXT,
  ADD COLUMN IF NOT EXISTS visual_difficulty INTEGER;

COMMENT ON COLUMN public.questions.figure_metadata IS 'Reserved for the future graphics/vision engine phase (chart provenance, currency state, extraction data). Not read or written by any code in the Practice Engine phase.';

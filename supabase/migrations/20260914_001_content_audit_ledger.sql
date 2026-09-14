-- Content audit ledger (Part 5/13 of the FAA-source content audit). Reuses the
-- existing validation_status column as the single status field rather than adding a
-- second, competing status vocabulary — it already distinguishes most of what the
-- audit needs (legacy/pending/approved/rejected/needs_review/retired); this only adds
-- the two states that were genuinely missing (outdated, disabled) and a small set of
-- citation/verification fields that didn't exist yet. Fully additive — no existing
-- row, value, or constraint is narrowed.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_validation_status_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_validation_status_check
  CHECK (validation_status IN (
    'legacy', 'pending', 'approved', 'rejected', 'generated', 'validating',
    'needs_review', 'retired', 'outdated', 'disabled'
  ));

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS source_title TEXT,        -- e.g. "FAA Instrument Flying Handbook"
  ADD COLUMN IF NOT EXISTS source_section TEXT,       -- e.g. "Chapter 8" / "91.57(c)(1)"
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,   -- when a human/audit pass last confirmed this row
  ADD COLUMN IF NOT EXISTS verified_by TEXT;          -- 'content-audit-2026-09' style tag, not a user_id — this is an editorial process marker, not a foreign key

COMMENT ON COLUMN public.questions.source_title IS 'Authoritative source document title (FAA handbook, AIM, eCFR, etc.) — see the reference/source_reference columns for the specific citation within it.';
COMMENT ON COLUMN public.questions.verified_at IS 'Set by the content-audit process (scripts/audit-*) when a question is independently re-verified against its source. Null means never re-verified since the audit began.';

CREATE INDEX IF NOT EXISTS idx_questions_verified_at ON public.questions(verified_at);

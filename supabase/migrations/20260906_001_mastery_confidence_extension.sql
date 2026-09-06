-- Phase 1 rebuild: extends concept_mastery with adaptive (SM-2-style) scheduling and
-- confidence-calibration counters, and adds per-attempt confidence + a lightweight
-- error-tag classification to test_answers. Fully additive — no existing column,
-- constraint, or row is altered or dropped. This repo's schema is applied manually
-- (see supabase-schema.sql); run this file's contents via psql or the Supabase SQL
-- editor against the live project.

ALTER TABLE public.concept_mastery
  ADD COLUMN IF NOT EXISTS ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS repetitions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confident_correct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confident_wrong INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guess_correct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guess_wrong INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.concept_mastery.ease_factor IS 'SM-2-style ease factor driving next_review interval growth; mirrors srs_cards.ease_factor but scoped per-concept rather than per-question.';
COMMENT ON COLUMN public.concept_mastery.confident_wrong IS 'Wrong answers marked very/somewhat confident — the highest-priority misconception signal per the confidence-calibration model.';

DO $$ BEGIN
  ALTER TABLE public.test_answers
    ADD COLUMN IF NOT EXISTS confidence TEXT
      CHECK (confidence IN ('very_confident', 'somewhat_confident', 'unsure', 'guessing'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.test_answers
    ADD COLUMN IF NOT EXISTS error_tag TEXT
      CHECK (error_tag IN ('concept_gap', 'calculation_error', 'distractor_trap'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.test_answers.confidence IS 'Student-reported confidence captured before the answer was revealed (practice/quiz flows). Null for flows that do not yet ask.';
COMMENT ON COLUMN public.test_answers.error_tag IS 'Lightweight heuristic classification of a wrong answer (concept_gap / calculation_error / distractor_trap), derived from archetype + confidence with no extra AI call. Null when correct or not classifiable. A full AI-judged 9-category taxonomy is a later phase.';

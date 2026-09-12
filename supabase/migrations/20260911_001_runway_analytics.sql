-- Test Runway analytics (spec section 25) — additive only. study_plan_state.exam_date
-- can change after creation (see api/runway/route.ts), so the runway's ORIGINAL type/
-- length would otherwise be unrecoverable once a student sets or moves their test
-- date. These two columns are written once, at row creation (see runwayServer.ts),
-- and never updated again — they exist purely so a later analysis can ask "did a
-- 14-day start behave differently from a 30-day default start" without needing a
-- separate events table yet. Everything else the spec asks to track (sessions
-- completed/missed, questions answered, novel accuracy, retention, readiness, exam
-- performance, reported FAA outcome) is already derivable from daily_plan_items,
-- concept_mastery, test_sessions, and exam_outcomes.
ALTER TABLE public.study_plan_state
  ADD COLUMN IF NOT EXISTS initial_runway_type TEXT CHECK (initial_runway_type IN ('default', 'dated')),
  ADD COLUMN IF NOT EXISTS initial_runway_days INTEGER;

-- Fixes the exam-type bug: server-side reads across the Runway, readiness, practice
-- home, and real-exam generation all gated the IFR cookie behind is_admin, silently
-- forcing every non-admin IFR student back to PPL content regardless of what they
-- selected. A durable per-user preference removes the dependence on a client cookie
-- that can be absent (other device, cleared storage) or was only ever honored for
-- admins. Also adds a real daily-minutes target so the onboarding "minutes per day"
-- answer can actually size the Runway's daily session instead of being stored inertly.
-- Fully additive.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_exam_type TEXT NOT NULL DEFAULT 'ppl'
    CHECK (preferred_exam_type IN ('ppl', 'ifr'));

ALTER TABLE public.study_plan_state
  ADD COLUMN IF NOT EXISTS daily_minutes_target INTEGER NOT NULL DEFAULT 20;

COMMENT ON COLUMN public.users.preferred_exam_type IS 'Durable exam-type preference set at signup, used server-side wherever the tarmac-exam-type cookie is absent — see lib/examType.ts getEffectiveExamType().';
COMMENT ON COLUMN public.study_plan_state.daily_minutes_target IS 'From onboarding "how many minutes a day" answer — scales generateDailyPlan()''s per-phase estimatedMinutes instead of using fixed constants.';

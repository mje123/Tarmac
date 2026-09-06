-- TARMAC Community Platform Migration
-- Safe to run: only adds columns/tables, no data is deleted except pilot_iq_results

-- 1. Drop Pilot IQ table (no user data)
DROP TABLE IF EXISTS pilot_iq_results;

-- 2. Add community columns to users (all nullable / have defaults — safe for existing rows)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS callsign TEXT,
  ADD COLUMN IF NOT EXISTS callsign_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS debrief_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_cfi BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cfi_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Unique constraint on callsign (allow NULL for users who haven't set one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_callsign_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_callsign_key UNIQUE (callsign);
  END IF;
END $$;

-- 3. Accident Debrief tables
CREATE TABLE IF NOT EXISTS accidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ntsb_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  prompt_one TEXT NOT NULL,
  prompt_two TEXT NOT NULL,
  phase_of_flight TEXT,
  aircraft_type TEXT,
  weather TEXT,
  probable_cause TEXT,
  region TEXT,
  year INT,
  raw_ntsb_json JSONB,
  posted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accident_id UUID REFERENCES accidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  upvote_count INT DEFAULT 0,
  is_removed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accident_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES accident_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS accident_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES accident_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 4. Ask a CFI tables
CREATE TABLE IF NOT EXISTS cfi_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  upvote_count INT DEFAULT 0,
  answer_count INT DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cfi_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES cfi_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_cfi_answer BOOLEAN DEFAULT false,
  upvote_count INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cfi_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('question', 'answer')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(target_id, user_id)
);

-- 5. Weather Room tables
CREATE TABLE IF NOT EXISTS weather_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metar TEXT,
  taf TEXT,
  pireps TEXT,
  notams TEXT,
  route TEXT,
  context TEXT,
  go_count INT DEFAULT 0,
  nogo_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weather_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES weather_scenarios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('go', 'nogo')),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scenario_id, user_id)
);

-- 6. Feature interest (Route Critique waitlist)
CREATE TABLE IF NOT EXISTS feature_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- 7. System config (cron state)
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO system_config (key, value) VALUES ('ntsb_last_offset', '0')
  ON CONFLICT (key) DO NOTHING;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_accident_comments_accident_id ON accident_comments(accident_id);
CREATE INDEX IF NOT EXISTS idx_accident_comments_user_id ON accident_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_accident_votes_comment_id ON accident_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_accident_flags_comment_id ON accident_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_cfi_questions_created_at ON cfi_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cfi_answers_question_id ON cfi_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_weather_scenarios_created_at ON weather_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_votes_scenario_id ON weather_votes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_accidents_is_active ON accidents(is_active, posted_at DESC);

-- 9. RLS
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfi_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfi_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfi_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- accidents: public read of active rows; service role all
CREATE POLICY "accidents_public_read" ON accidents FOR SELECT USING (is_active = true);
CREATE POLICY "accidents_service_all" ON accidents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- accident_comments: auth read non-removed; own insert; own delete
CREATE POLICY "accident_comments_auth_read" ON accident_comments FOR SELECT USING (auth.uid() IS NOT NULL AND is_removed = false);
CREATE POLICY "accident_comments_own_insert" ON accident_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accident_comments_own_delete" ON accident_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "accident_comments_service_all" ON accident_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- accident_votes: auth insert/delete own
CREATE POLICY "accident_votes_auth_read" ON accident_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "accident_votes_own_insert" ON accident_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accident_votes_own_delete" ON accident_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "accident_votes_service_all" ON accident_votes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- accident_flags: auth insert own
CREATE POLICY "accident_flags_own_insert" ON accident_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accident_flags_service_all" ON accident_flags FOR ALL TO service_role USING (true) WITH CHECK (true);

-- cfi_questions: auth read all; auth insert own
CREATE POLICY "cfi_questions_auth_read" ON cfi_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cfi_questions_own_insert" ON cfi_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cfi_questions_service_all" ON cfi_questions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- cfi_answers: auth read all; auth insert own
CREATE POLICY "cfi_answers_auth_read" ON cfi_answers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cfi_answers_own_insert" ON cfi_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cfi_answers_service_all" ON cfi_answers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- cfi_votes: auth read/insert/delete own
CREATE POLICY "cfi_votes_auth_read" ON cfi_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cfi_votes_own_insert" ON cfi_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cfi_votes_own_delete" ON cfi_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "cfi_votes_service_all" ON cfi_votes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- weather_scenarios: auth read/insert own
CREATE POLICY "weather_scenarios_auth_read" ON weather_scenarios FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "weather_scenarios_own_insert" ON weather_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weather_scenarios_service_all" ON weather_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);

-- weather_votes: auth read/insert/update own
CREATE POLICY "weather_votes_auth_read" ON weather_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "weather_votes_own_insert" ON weather_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weather_votes_own_update" ON weather_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weather_votes_service_all" ON weather_votes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- feature_interest: own insert/read
CREATE POLICY "feature_interest_own_read" ON feature_interest FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feature_interest_own_insert" ON feature_interest FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feature_interest_service_all" ON feature_interest FOR ALL TO service_role USING (true) WITH CHECK (true);

-- system_config: service role only
CREATE POLICY "system_config_service_all" ON system_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant service role access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

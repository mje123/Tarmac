-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS qotd_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'situation',  -- 'situation' | 'checkride' | 'written'
  context TEXT,                                      -- optional scenario setup shown above question
  active_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qotd_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES qotd_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  response_text TEXT NOT NULL,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS qotd_response_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES qotd_responses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, user_id)
);

CREATE TABLE IF NOT EXISTS qotd_response_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES qotd_responses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE qotd_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qotd_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qotd_response_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qotd_response_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_qotd_posts"      ON qotd_posts              FOR SELECT USING (true);
CREATE POLICY "service_all_qotd_posts"      ON qotd_posts              FOR ALL    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_responses"         ON qotd_responses          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_response"        ON qotd_responses          FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service_all_responses"       ON qotd_responses          FOR ALL    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_likes"             ON qotd_response_likes     FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_like"            ON qotd_response_likes     FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete_own_like"        ON qotd_response_likes     FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "service_all_likes"           ON qotd_response_likes     FOR ALL    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_comments"          ON qotd_response_comments  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_comment"         ON qotd_response_comments  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service_all_comments"        ON qotd_response_comments  FOR ALL    TO service_role USING (true) WITH CHECK (true);

-- Helper RPC functions for atomic like count updates
CREATE OR REPLACE FUNCTION increment_qotd_likes(response_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE qotd_responses SET like_count = like_count + 1 WHERE id = response_id;
$$;

CREATE OR REPLACE FUNCTION decrement_qotd_likes(response_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE qotd_responses SET like_count = GREATEST(0, like_count - 1) WHERE id = response_id;
$$;

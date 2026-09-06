-- Route Critique feature

CREATE TABLE IF NOT EXISTS route_critiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  waypoints TEXT,
  altitude TEXT,
  description TEXT NOT NULL,
  date_of_flight DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_removed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS route_critique_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES route_critiques(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_removed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_route_critiques_created_at ON route_critiques(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_critique_comments_route_id ON route_critique_comments(route_id);

ALTER TABLE route_critiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_critique_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routes_auth_read" ON route_critiques FOR SELECT USING (auth.uid() IS NOT NULL AND is_removed = false);
CREATE POLICY "routes_own_insert" ON route_critiques FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routes_own_delete" ON route_critiques FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "routes_service_all" ON route_critiques FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "route_comments_auth_read" ON route_critique_comments FOR SELECT USING (auth.uid() IS NOT NULL AND is_removed = false);
CREATE POLICY "route_comments_own_insert" ON route_critique_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "route_comments_own_delete" ON route_critique_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "route_comments_service_all" ON route_critique_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

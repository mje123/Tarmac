-- TARMAC Database Schema
-- Run this in Supabase SQL Editor

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'study_pass', 'checkride_prep', 'annual')),
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  category TEXT NOT NULL CHECK (category IN (
    'Regulations', 'Airspace', 'Weather Theory', 'Weather Services',
    'Aircraft Performance', 'Weight & Balance', 'Aerodynamics',
    'Flight Instruments', 'Navigation'
  )),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  explanation TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Test sessions
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('real_exam', 'practice_mode')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_remaining_seconds INTEGER,
  score INTEGER,
  total_questions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- 4. Test answers
CREATE TABLE IF NOT EXISTS public.test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  is_marked_for_review BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ,
  ai_explanation_requested BOOLEAN NOT NULL DEFAULT false
);

-- 5. User progress
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_practiced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- 6. AI conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.test_sessions(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Saved questions
CREATE TABLE IF NOT EXISTS public.saved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_questions_user_id ON public.saved_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_session_id ON public.test_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_question_id ON public.test_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Questions policies (anyone authenticated can read)
CREATE POLICY "Authenticated users can read questions" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Test sessions policies
CREATE POLICY "Users can view their own sessions" ON public.test_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.test_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.test_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Test answers policies
CREATE POLICY "Users can manage their own answers" ON public.test_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can view all answers" ON public.test_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- User progress policies
CREATE POLICY "Users can manage their own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.user_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- AI conversations policies
CREATE POLICY "Users can manage their own conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Saved questions policies
CREATE POLICY "Users can manage their own saved questions" ON public.saved_questions
  FOR ALL USING (auth.uid() = user_id);

-- Grant service role full access (for webhook)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

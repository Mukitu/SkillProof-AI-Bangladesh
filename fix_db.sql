-- Fix cv_resumes policies
DROP POLICY IF EXISTS "Users can handle own resumes" ON public.cv_resumes;
DROP POLICY IF EXISTS "Users can manage own resumes" ON public.cv_resumes;
CREATE POLICY "Users can manage own resumes" ON public.cv_resumes FOR ALL USING (auth.uid() = user_id);

-- Fix interview_sessions
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS cv_id UUID REFERENCES public.cv_resumes(id) ON DELETE SET NULL;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS career_path TEXT;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS qa JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Users can handle own sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage own sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

-- Fix reports
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP POLICY IF EXISTS "Users can manage their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can manage own reports" ON public.reports;
CREATE POLICY "Users can manage own reports" ON public.reports FOR ALL USING (auth.uid() = user_id);

-- Fix download history
DROP POLICY IF EXISTS "Users can manage their own download history" ON public.download_history;
CREATE POLICY "Users can manage their own download history" ON public.download_history FOR ALL USING (auth.uid() = user_id);

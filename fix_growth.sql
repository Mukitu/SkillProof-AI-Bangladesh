CREATE TABLE IF NOT EXISTS public.career_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0,
    resume_score INTEGER DEFAULT 0,
    ats_score INTEGER DEFAULT 0,
    interview_score INTEGER DEFAULT 0,
    skill_score INTEGER DEFAULT 0,
    profile_completion INTEGER DEFAULT 0,
    strengths JSONB DEFAULT '[]'::JSONB,
    weaknesses JSONB DEFAULT '[]'::JSONB,
    job_readiness TEXT,
    readiness_reason TEXT,
    ai_suggestions JSONB DEFAULT '{}'::JSONB,
    learning_resources JSONB DEFAULT '[]'::JSONB,
    project_recommendations JSONB DEFAULT '[]'::JSONB,
    career_paths JSONB DEFAULT '[]'::JSONB,
    action_plan JSONB DEFAULT '{}'::JSONB,
    last_generated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP POLICY IF EXISTS "Users can manage own career progress" ON public.career_progress;
CREATE POLICY "Users can manage own career progress" ON public.career_progress FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.career_progress ENABLE ROW LEVEL SECURITY;

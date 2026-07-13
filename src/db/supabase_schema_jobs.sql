-- ========================================================
-- SkillProof AI Bangladesh - Jobs Feature Schema
-- ========================================================

-- Ensure the profiles table is updated with administrative and membership columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expiry TEXT;

-- ১৫. জবস টেবিল (Jobs Table)
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    banner_image TEXT,
    job_title TEXT NOT NULL,
    job_category TEXT NOT NULL,
    job_type TEXT NOT NULL,
    location TEXT NOT NULL,
    salary TEXT NOT NULL,
    experience TEXT NOT NULL,
    education TEXT NOT NULL,
    vacancy INTEGER DEFAULT 1,
    employment_status TEXT DEFAULT 'active',
    responsibilities TEXT NOT NULL,
    requirements TEXT NOT NULL,
    preferred_skills TEXT NOT NULL,
    benefits TEXT NOT NULL,
    deadline TEXT NOT NULL,
    official_apply_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    featured_image TEXT,
    publish_status TEXT DEFAULT 'Published' NOT NULL,
    featured_job BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ১৬. সেভড জবস টেবিল (Saved Jobs Table)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_id TEXT REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, job_id)
);

-- Row Level Security (RLS) Rules for Jobs & Saved Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
DROP POLICY IF EXISTS "Allow public read access to published jobs" ON public.jobs;
CREATE POLICY "Allow public read access to published jobs" ON public.jobs 
    FOR SELECT USING (publish_status = 'Published');

DROP POLICY IF EXISTS "Allow full admin management of jobs" ON public.jobs;
CREATE POLICY "Allow full admin management of jobs" ON public.jobs 
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'nishat.af27@gmail.com' OR 
        (auth.jwt() ->> 'email') = 'mukituislamnishat@gmail.com' OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Saved Jobs Policies
DROP POLICY IF EXISTS "Users can manage own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs 
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(job_category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(publish_status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);

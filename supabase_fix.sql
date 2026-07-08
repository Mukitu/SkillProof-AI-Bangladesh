-- ====================================================================
-- SKILLPROOF AI BANGLADESH - MASTER SUPABASE SCHEMA (PRODUCTION READY)
-- ====================================================================

-- ১. প্রোফাইল টেবিল (Profiles Table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    experience TEXT,
    education TEXT,
    skills JSONB DEFAULT '[]'::JSONB,
    social_links JSONB DEFAULT '{}'::JSONB,
    address TEXT,
    university TEXT,
    department TEXT,
    semester TEXT,
    linkedin TEXT,
    github TEXT,
    portfolio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. স্কিল পাসপোর্ট টেবিল (Skill Passports Table)
CREATE TABLE IF NOT EXISTS public.skill_passports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE,
    passport_id TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    career_path TEXT,
    resume_score INTEGER DEFAULT 0,
    ats_score INTEGER DEFAULT 0,
    interview_score INTEGER DEFAULT 0,
    readiness_score INTEGER DEFAULT 0,
    summary TEXT,
    qr_code_url TEXT,
    verified_skills JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. সিভি রেজুমে টেবিল (CV Resumes Table)
CREATE TABLE IF NOT EXISTS public.cv_resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    "personalInfo" JSONB DEFAULT '{}'::JSONB,
    "careerSummary" TEXT,
    "improvedCareerSummary" TEXT,
    "education" JSONB DEFAULT '[]'::JSONB,
    "experience" JSONB DEFAULT '[]'::JSONB,
    "projects" JSONB DEFAULT '[]'::JSONB,
    "skills" JSONB DEFAULT '[]'::JSONB,
    "templateId" TEXT DEFAULT 'modern',
    "isAnalyzed" BOOLEAN DEFAULT FALSE,
    "scores" JSONB DEFAULT '{}'::JSONB,
    "feedback" JSONB DEFAULT '{}'::JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. ইন্টারভিউ সেশন টেবিল (Interview Sessions Table)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    cv_id UUID REFERENCES public.cv_resumes(id) ON DELETE SET NULL,
    career_path TEXT,
    skills JSONB DEFAULT '[]'::JSONB,
    status TEXT DEFAULT 'pending',
    scores JSONB DEFAULT '{}'::JSONB,
    feedback JSONB DEFAULT '{}'::JSONB,
    duration INTEGER DEFAULT 0,
    qa JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ADD COLUMNS IF THEY WERE MISSING FROM PREVIOUS MIGRATION
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS cv_id UUID REFERENCES public.cv_resumes(id) ON DELETE SET NULL;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS career_path TEXT;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS qa JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ৫. ইন্টারভিউ মেমোরি টেবিল (Interview Memories Table)
CREATE TABLE IF NOT EXISTS public.interview_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE,
    weak_topics JSONB DEFAULT '[]'::JSONB,
    strong_topics JSONB DEFAULT '[]'::JSONB,
    previous_questions JSONB DEFAULT '[]'::JSONB,
    previous_mistakes JSONB DEFAULT '[]'::JSONB,
    improvement_history JSONB DEFAULT '[]'::JSONB,
    learning_suggestions JSONB DEFAULT '[]'::JSONB,
    readiness_explanation TEXT,
    readiness_score INTEGER DEFAULT 0,
    study_plan JSONB DEFAULT '{}'::JSONB,
    metrics JSONB DEFAULT '{}'::JSONB,
    ai_insights JSONB DEFAULT '{}'::JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ৬. এআই রিপোর্টস (AI Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    type TEXT NOT NULL,
    title_bn TEXT,
    title_en TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD COLUMNS IF THEY WERE MISSING FROM PREVIOUS MIGRATION
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ৭. ডাউনলোড ইতিহাস (Download History)
CREATE TABLE IF NOT EXISTS public.download_history (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    download_date TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Policies for Skill Passports
DROP POLICY IF EXISTS "Public can view passports" ON public.skill_passports;
CREATE POLICY "Public can view passports" ON public.skill_passports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own passport" ON public.skill_passports;
CREATE POLICY "Users can manage own passport" ON public.skill_passports FOR ALL USING (auth.uid() = user_id);

-- Policies for CV Resumes
DROP POLICY IF EXISTS "Users can manage own resumes" ON public.cv_resumes;
CREATE POLICY "Users can manage own resumes" ON public.cv_resumes FOR ALL USING (auth.uid() = user_id);

-- Policies for Interview Sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage own sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

-- Policies for Reports
DROP POLICY IF EXISTS "Users can manage own reports" ON public.reports;
CREATE POLICY "Users can manage own reports" ON public.reports FOR ALL USING (auth.uid() = user_id);


-- ====================================================================
-- STORAGE BUCKET SETUP INSTRUCTIONS (DASHBOARD)
-- ====================================================================
-- ১. 'avatars' - Public Bucket (for user profile pictures)
-- ২. 'cv_storage' - Private/Public Bucket (for resume PDFs)
-- ৩. 'reports' - Private/Public Bucket (for generated reports)
-- ৪. 'passport' - Public Bucket (for passport QR codes/cards)

-- 8. Career Progress (AI Career Growth Hub)
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
CREATE TABLE IF NOT EXISTS public.career_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    target_career TEXT,
    phases JSONB DEFAULT '[]'::JSONB,
    daily_tasks JSONB DEFAULT '{}'::JSONB,
    last_generated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP POLICY IF EXISTS "Users can manage own roadmaps" ON public.career_roadmaps;
CREATE POLICY "Users can manage own roadmaps" ON public.career_roadmaps FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;

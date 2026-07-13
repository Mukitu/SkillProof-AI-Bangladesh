-- ==========================================
-- SkillProof AI Bangladesh (Supabase Schema)
-- ==========================================

-- ১. প্রোফাইল টেবিল (Profiles Table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    education TEXT,
    experience TEXT,
    skills TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{"github": "", "linkedin": "", "portfolio": ""}'::jsonb,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    premium BOOLEAN DEFAULT FALSE,
    premium_expiry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- প্রোফাইল আপডেটের উপর নির্ভর করে updated_at আপডেট করার জন্য ট্রিগার ফাংশন
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ২. ইউজার সেটিংস টেবিল (User Settings Table)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    language VARCHAR(10) DEFAULT 'bn' NOT NULL,
    theme VARCHAR(10) DEFAULT 'dark' NOT NULL,
    notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. সিভি ফোল্ডার (cv_resumes)
CREATE TABLE IF NOT EXISTS public.cv_resumes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "personalInfo" JSONB,
    "careerSummary" TEXT,
    "improvedCareerSummary" TEXT,
    "education" JSONB,
    "experience" JSONB,
    "projects" JSONB,
    "skills" JSONB,
    "templateId" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "scores" JSONB,
    "feedback" JSONB,
    "isAnalyzed" BOOLEAN DEFAULT FALSE
);

-- ৪. ইন্টারভিউ সেশন (interview_sessions)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cv_id TEXT,
    career_path TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    skills JSONB,
    scores JSONB,
    feedback JSONB,
    duration INT,
    qa JSONB,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

-- ৫. ইন্টারভিউ মেমোরি (interview_memories)
CREATE TABLE IF NOT EXISTS public.interview_memories (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    weak_topics TEXT,
    strong_topics TEXT,
    previous_questions TEXT,
    previous_mistakes TEXT,
    improvement_history TEXT,
    learning_suggestions TEXT,
    readiness_explanation TEXT,
    readiness_score INT,
    study_plan TEXT,
    metrics TEXT,
    ai_insights TEXT,
    last_updated TEXT NOT NULL
);

-- ৬. রিপোর্টস টেবিল (reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title_bn TEXT,
    title_en TEXT,
    created_at TEXT NOT NULL,
    data JSONB
);

-- ৭. ডাউনলোড হিস্ট্রি (download_history)
CREATE TABLE IF NOT EXISTS public.download_history (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    type TEXT NOT NULL,
    download_date TEXT NOT NULL,
    status TEXT NOT NULL
);

-- ৮. অ্যাসেসমেন্ট টেবিল (assessments)
CREATE TABLE IF NOT EXISTS public.assessments (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    skill TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    duration INTEGER,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    trust_score INTEGER DEFAULT 100,
    question_data TEXT,
    project_data TEXT,
    user_solution_code TEXT,
    submitted_zip_name TEXT,
    submitted_github_url TEXT,
    submitted_demo_url TEXT,
    submitted_documentation TEXT,
    scores JSONB,
    feedback JSONB
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) RULES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Settings Policies
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- CV Resumes Policies
DROP POLICY IF EXISTS "Users can manage own resumes" ON public.cv_resumes;
CREATE POLICY "Users can manage own resumes" ON public.cv_resumes FOR ALL USING (auth.uid() = user_id);

-- Interviews Policies
DROP POLICY IF EXISTS "Users can manage own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage own interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own interview memories" ON public.interview_memories;
CREATE POLICY "Users can manage own interview memories" ON public.interview_memories FOR ALL USING (auth.uid() = user_id);

-- Reports Policies
DROP POLICY IF EXISTS "Users can manage own reports" ON public.reports;
CREATE POLICY "Users can manage own reports" ON public.reports FOR ALL USING (auth.uid() = user_id);

-- Download History Policies
DROP POLICY IF EXISTS "Users can manage own download history" ON public.download_history;
CREATE POLICY "Users can manage own download history" ON public.download_history FOR ALL USING (auth.uid() = user_id);

-- Assessments Policies
DROP POLICY IF EXISTS "Users can manage own assessments" ON public.assessments;
CREATE POLICY "Users can manage own assessments" ON public.assessments FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- DATABASE TRIGGER (AUTO CREATE PROFILE)
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'নতুন ব্যবহারকারী'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_settings (user_id, language, theme, notifications_enabled)
  VALUES (NEW.id, 'bn', 'dark', TRUE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment the trigger to automatically insert profiles and settings on signup!
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- TESTIMONIALS & PLATFORM STATISTICS TABLES
-- ========================================================

-- Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT NOT NULL,
    comment TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Statistics Table
CREATE TABLE IF NOT EXISTS public.statistics (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    labelEn TEXT NOT NULL,
    color TEXT DEFAULT 'text-brand-green',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for select (public access)
DROP POLICY IF EXISTS "Allow public select on testimonials" ON public.testimonials;
CREATE POLICY "Allow public select on testimonials" ON public.testimonials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select on statistics" ON public.statistics;
CREATE POLICY "Allow public select on statistics" ON public.statistics FOR SELECT USING (true);

-- Create policies for write (authenticated users)
DROP POLICY IF EXISTS "Allow authenticated write on testimonials" ON public.testimonials;
CREATE POLICY "Allow authenticated write on testimonials" ON public.testimonials FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated write on statistics" ON public.statistics;
CREATE POLICY "Allow authenticated write on statistics" ON public.statistics FOR ALL USING (auth.role() = 'authenticated');


-- ৯. Project Submissions (project_submissions)
CREATE TABLE IF NOT EXISTS public.project_submissions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    link TEXT NOT NULL,
    feedback TEXT,
    mark INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own project submissions" ON public.project_submissions;
CREATE POLICY "Users can manage own project submissions" ON public.project_submissions FOR ALL USING (auth.uid() = user_id);

-- ১০. স্কিল পাসপোর্ট (skill_passports)
CREATE TABLE IF NOT EXISTS public.skill_passports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    passport_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    career_path TEXT,
    resume_score INTEGER,
    ats_score INTEGER,
    interview_score INTEGER,
    readiness_score INTEGER,
    summary TEXT,
    avatar_url TEXT,
    updated_at TEXT NOT NULL
);
ALTER TABLE public.skill_passports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own skill passports" ON public.skill_passports;
CREATE POLICY "Users can manage own skill passports" ON public.skill_passports FOR ALL USING (auth.uid() = user_id);

-- ১১. ক্যারিয়ার প্রগ্রেস (career_progress)
CREATE TABLE IF NOT EXISTS public.career_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    target_role TEXT NOT NULL,
    current_level TEXT,
    target_level TEXT,
    progress_percentage INTEGER,
    learning_hours INTEGER,
    tasks_completed INTEGER,
    total_tasks INTEGER,
    next_milestone TEXT,
    last_generated TEXT NOT NULL,
    roadmaps JSONB,
    history JSONB,
    skills JSONB,
    tasks JSONB,
    metrics JSONB
);
ALTER TABLE public.career_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own career progress" ON public.career_progress;
CREATE POLICY "Users can manage own career progress" ON public.career_progress FOR ALL USING (auth.uid() = user_id);

-- ১২. ক্যারিয়ার রোডম্যাপ (career_roadmaps)
CREATE TABLE IF NOT EXISTS public.career_roadmaps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    career_path TEXT NOT NULL,
    current_level TEXT NOT NULL,
    target_level TEXT NOT NULL,
    duration TEXT,
    description TEXT,
    phases JSONB,
    created_at TEXT NOT NULL
);
ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own career roadmaps" ON public.career_roadmaps;
CREATE POLICY "Users can manage own career roadmaps" ON public.career_roadmaps FOR ALL USING (auth.uid() = user_id);

-- ১৩. সিভি ইম্প্রুভমেন্ট হিস্ট্রি (cv_improvement_history)
CREATE TABLE IF NOT EXISTS public.cv_improvement_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cv_id TEXT NOT NULL,
    section TEXT NOT NULL,
    section_item_id TEXT,
    before_text TEXT,
    after_text TEXT,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL
);
ALTER TABLE public.cv_improvement_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cv improvement history" ON public.cv_improvement_history;
CREATE POLICY "Users can manage own cv improvement history" ON public.cv_improvement_history FOR ALL USING (auth.role() = 'authenticated');

-- ১৪. এক্সাম ভায়োলেশন (exam_violations)
CREATE TABLE IF NOT EXISTS public.exam_violations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    assessment_id TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL
);
ALTER TABLE public.exam_violations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own exam violations" ON public.exam_violations;
CREATE POLICY "Users can view own exam violations" ON public.exam_violations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own exam violations" ON public.exam_violations;
CREATE POLICY "Users can insert own exam violations" ON public.exam_violations FOR INSERT WITH CHECK (auth.uid() = user_id);

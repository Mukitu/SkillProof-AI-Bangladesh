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
    "userId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "personalInfo" TEXT,
    "careerSummary" TEXT,
    "improvedCareerSummary" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "projects" TEXT,
    "skills" TEXT,
    "templateId" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "scores" TEXT,
    "feedback" TEXT,
    "isAnalyzed" BOOLEAN DEFAULT FALSE
);

-- ৪. ইন্টারভিউ সেশন (interview_sessions)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id TEXT PRIMARY KEY,
    "userId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "cvId" TEXT,
    "careerPath" TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    skills TEXT,
    scores TEXT,
    feedback TEXT,
    duration INT,
    qa TEXT,
    "createdAt" TEXT NOT NULL,
    "completedAt" TEXT
);

-- ৫. ইন্টারভিউ মেমোরি (interview_memories)
CREATE TABLE IF NOT EXISTS public.interview_memories (
    id TEXT PRIMARY KEY,
    "userId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "weakTopics" TEXT,
    "strongTopics" TEXT,
    "previousQuestions" TEXT,
    "previousMistakes" TEXT,
    "improvementHistory" TEXT,
    "learningSuggestions" TEXT,
    "readinessExplanation" TEXT,
    "readinessScore" INT,
    "studyPlan" TEXT,
    metrics TEXT,
    "aiInsights" TEXT,
    "lastUpdated" TEXT NOT NULL
);

-- ৬. রিপোর্টস টেবিল (reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    "userId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "reportType" TEXT NOT NULL,
    "generatedAt" TEXT NOT NULL,
    "cvScore" INT,
    "interviewScore" INT,
    "overallScore" INT,
    strengths TEXT,
    weaknesses TEXT,
    "improvementPlan" TEXT,
    "pdfUrl" TEXT
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

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Settings Policies
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- CV Resumes Policies
CREATE POLICY "Users can manage own resumes" ON public.cv_resumes FOR ALL USING (auth.uid() = "userId");

-- Interviews Policies
CREATE POLICY "Users can manage own interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = "userId");
CREATE POLICY "Users can manage own interview memories" ON public.interview_memories FOR ALL USING (auth.uid() = "userId");

-- Reports Policies
CREATE POLICY "Users can manage own reports" ON public.reports FOR ALL USING (auth.uid() = "userId");

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

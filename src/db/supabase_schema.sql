-- ==========================================
-- SkillProof AI Bangladesh (Supabase Schema)
-- ==========================================
-- এই ফাইলটি Supabase SQL এডিটর এ রান করে ডাটাবেজ সেটআপ করতে হবে।
-- (Run this script in the Supabase SQL Editor to provision tables)

-- ১. প্রোফাইল টেবিল (Profiles Table)
-- ব্যবহারকারীর ব্যক্তিগত এবং পেশাদার তথ্যাদি সংরক্ষণের জন্য।
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
-- থিম, ভাষা এবং নোটিফিকেশন প্রেফারেন্স সংরক্ষণের জন্য।
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    language VARCHAR(10) DEFAULT 'bn' NOT NULL, -- 'bn' অথবা 'en'
    theme VARCHAR(10) DEFAULT 'dark' NOT NULL,   -- 'light' অথবা 'dark'
    notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. সিভি ফাইল টেবিল (CV Files Table)
-- ব্যবহারকারীর আপলোড করা পিডিএফ/ডক ফাইলসমূহ ট্র্যাক করার জন্য।
CREATE TABLE IF NOT EXISTS public.cv_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL,
    file_path TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'processing' NOT NULL, -- 'processing', 'verified', 'failed'
    score INT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৪. ইন্টারভিউ টেবিল (Interviews Table)
-- ব্যবহারকারীর এআই মৌখিক পরীক্ষা বা ইন্টারভিউ সেশনসমূহ ট্র্যাক করার জন্য।
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'in_progress', 'completed'
    score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ৫. ইন্টারভিউ উত্তরসমূহ টেবিল (Interview Answers Table)
-- ইন্টারভিউ চলাকালীন প্রতিটি প্রশ্নের উত্তর ট্র্যাক করার জন্য।
CREATE TABLE IF NOT EXISTS public.interview_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    user_answer TEXT,
    ai_evaluation TEXT,
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৬. স্কিল ব্যাজ টেবিল (Skill Badges Table / Passport)
-- পরীক্ষিত দক্ষতার ওপর ভিত্তি করে অর্জিত ব্যাজসমূহ।
CREATE TABLE IF NOT EXISTS public.skill_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_name TEXT NOT NULL,
    level VARCHAR(20) DEFAULT 'intermediate' NOT NULL, -- 'beginner', 'intermediate', 'expert'
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    credential_url TEXT
);

-- ৭. ক্যারিয়ার রোডম্যাপ টেবিল (Roadmaps Table)
-- ব্যবহারকারীর লক্ষ্য অনুযায়ী এআই জেনারেটেড লার্নিং রোডম্যাপ।
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_role TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- ধাপগুলোর লিস্ট
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৮. প্রোগ্রেস হিস্ট্রি টেবিল (Progress History Table)
-- ব্যবহারকারীর সামগ্রিক অগ্রগতি রেকর্ড করার জন্য।
CREATE TABLE IF NOT EXISTS public.progress_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL, -- 'cv_uploaded', 'interview_completed', 'badge_earned'
    points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৯. ডাউনলোড টেবিল (Downloads Table)
-- ভেরিফাইড সিভি এবং স্কিল পাসপোর্ট পিডিএফ ডাউনলোডের রেকর্ড।
CREATE TABLE IF NOT EXISTS public.downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL, -- 'verified_cv', 'skill_passport'
    download_url TEXT NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ১০. সাবস্ক্রিপশন টেবিল (Subscriptions Table)
-- ব্যবহারকারীদের পেমেন্ট এবং সাবস্ক্রিপশন প্ল্যানসমূহ ট্র্যাক করার জন্য।
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT DEFAULT 'Free' NOT NULL, -- 'Free', 'Pro', 'Enterprise'
    status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'canceled', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ১১. রিপোর্ট টেবিল (Reports Table)
-- দক্ষতার বিশ্লেষণ ও দুর্বলতার বিবরণসহ পিডিএফ রিপোর্ট ট্র্যাকিং।
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_title TEXT NOT NULL,
    score INT,
    strengths TEXT[],
    weaknesses TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) RULES
-- ব্যবহারকারীদের তথ্যের নিরাপত্তা সুনিশ্চিত করার জন্য।
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- উদাহরণ পলিসি: প্রোফাইল কেবলমাত্র ইউজার নিজে দেখতে ও এডিট করতে পারবেন।
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ইউজার সেটিংস পলিসি
CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- সিভি ফাইল পলিসি
CREATE POLICY "Users can manage own CV files" ON public.cv_files
    FOR ALL USING (auth.uid() = user_id);

-- এআই ট্রেইলার ফাংশন: নতুন ইউজার সাইনআপের সাথে সাথে প্রোফাইল ও সেটিংস জেনারেশন।
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

-- ট্রিগার অন সাইনআপ
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

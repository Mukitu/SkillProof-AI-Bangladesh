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

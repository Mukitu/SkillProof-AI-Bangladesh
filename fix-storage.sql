-- Create avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- Create cv_storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('cv_storage', 'cv_storage', true) ON CONFLICT (id) DO NOTHING;

-- Fix RLS for avatars
DROP POLICY IF EXISTS "Avatar public access" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own avatars" ON storage.objects;

CREATE POLICY "Avatar public access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can manage own avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix RLS for cv_storage
DROP POLICY IF EXISTS "CV storage public access" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own cv files" ON storage.objects;

CREATE POLICY "CV storage public access" ON storage.objects FOR SELECT USING (bucket_id = 'cv_storage');
CREATE POLICY "Users can manage own cv files" ON storage.objects FOR ALL USING (bucket_id = 'cv_storage' AND auth.uid()::text = (storage.foldername(name))[1]);


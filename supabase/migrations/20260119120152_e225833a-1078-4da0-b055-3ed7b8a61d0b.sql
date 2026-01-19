-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view user uploads (public bucket)
DROP POLICY IF EXISTS "Public can view user uploads" ON storage.objects;
CREATE POLICY "Public can view user uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-uploads');

-- Authenticated users can upload their own files
DROP POLICY IF EXISTS "Authenticated can upload user assets" ON storage.objects;
CREATE POLICY "Authenticated can upload user assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid() = owner);

-- Authenticated users can update their own files
DROP POLICY IF EXISTS "Authenticated can update user uploads" ON storage.objects;
CREATE POLICY "Authenticated can update user uploads"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid() = owner);

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "Authenticated can delete user uploads" ON storage.objects;
CREATE POLICY "Authenticated can delete user uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid() = owner);
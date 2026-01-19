-- Allow authenticated users to upload to user-uploads without owner check
DROP POLICY IF EXISTS "Authenticated can upload user assets" ON storage.objects;

CREATE POLICY "Authenticated can upload user assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');
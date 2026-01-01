-- Create storage bucket for AI-generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-images', 'ai-images', true);

-- RLS policy: Anyone can view AI images (public bucket)
CREATE POLICY "Public can view AI images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-images');

-- RLS policy: Service role can insert AI images
CREATE POLICY "Service role can insert AI images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-images');

-- RLS policy: Editors and managers can delete AI images
CREATE POLICY "Editors and managers can delete AI images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ai-images');
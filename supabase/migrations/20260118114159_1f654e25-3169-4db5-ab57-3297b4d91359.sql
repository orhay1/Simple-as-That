-- Create a public view that excludes sensitive token fields
CREATE VIEW public.linkedin_connections_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    profile_name,
    profile_id,
    avatar_url,
    headline,
    is_connected,
    connected_at,
    expires_at,
    created_at,
    updated_at
  FROM public.linkedin_connections;
  -- Excludes: access_token, refresh_token (sensitive OAuth credentials)

-- IMPORTANT: Comment explaining the security model
-- The base table 'linkedin_connections' stores sensitive OAuth tokens
-- that should ONLY be accessed by edge functions using service role key.
-- Client-side code should query 'linkedin_connections_public' view instead.

-- Drop the existing SELECT policy that allows reading all fields
DROP POLICY IF EXISTS "Users can view own linkedin connection (safe fields only)" ON public.linkedin_connections;

-- Create a new SELECT policy that DENIES direct table access
-- This prevents clients from bypassing the view and reading tokens directly
CREATE POLICY "Deny direct SELECT - use linkedin_connections_public view" 
ON public.linkedin_connections 
FOR SELECT 
USING (false);

-- Note: INSERT, UPDATE, DELETE policies remain unchanged
-- Edge functions use service role key which bypasses RLS entirely
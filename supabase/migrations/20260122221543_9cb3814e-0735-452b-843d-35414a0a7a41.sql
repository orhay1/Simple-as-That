-- Fix: Recreate linkedin_connections_public view with security_invoker = true
-- This ensures the view respects the RLS policies on the base linkedin_connections table

-- Drop the existing view
DROP VIEW IF EXISTS public.linkedin_connections_public;

-- Recreate the view with security_invoker = true
-- This view excludes sensitive OAuth tokens (access_token, refresh_token)
-- and only exposes non-sensitive profile information
CREATE VIEW public.linkedin_connections_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  is_connected,
  profile_name,
  profile_id,
  avatar_url,
  headline,
  connected_at,
  expires_at,
  created_at,
  updated_at
FROM public.linkedin_connections;

-- Add a comment explaining the security design
COMMENT ON VIEW public.linkedin_connections_public IS 'Public view of LinkedIn connections excluding sensitive OAuth tokens. Uses security_invoker=true to respect base table RLS policies.';
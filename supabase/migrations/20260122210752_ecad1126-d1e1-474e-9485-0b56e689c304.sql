-- Fix 1: Add RLS to linkedin_connections_public view
-- Since this is a VIEW (not a table), we need to enable RLS on the underlying table
-- The view already exposes only non-sensitive fields, but we need RLS on the view itself

-- First check if RLS is enabled on the view (views inherit RLS from base table)
-- Since linkedin_connections already has proper RLS, and this is a view of it,
-- we need to add a security barrier to the view to prevent data leakage

-- Drop and recreate the view with SECURITY INVOKER to respect RLS
DROP VIEW IF EXISTS public.linkedin_connections_public;

CREATE VIEW public.linkedin_connections_public 
WITH (security_invoker = true)
AS SELECT 
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

-- Grant access to authenticated users only
REVOKE ALL ON public.linkedin_connections_public FROM anon;
REVOKE ALL ON public.linkedin_connections_public FROM public;
GRANT SELECT ON public.linkedin_connections_public TO authenticated;

-- Fix 2: Replace the overly permissive INSERT policy on ai_output_ledger
-- Change from WITH CHECK (true) to a proper user-scoped check
-- First, we need to add a user_id column to ai_output_ledger to track ownership

-- Add user_id column if it doesn't exist
ALTER TABLE public.ai_output_ledger 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create ai entries" ON public.ai_output_ledger;

-- Create proper user-scoped INSERT policy
CREATE POLICY "Users can create own ai ledger entries"
ON public.ai_output_ledger
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update SELECT policy to be user-scoped as well
DROP POLICY IF EXISTS "Authenticated users can view ai ledger" ON public.ai_output_ledger;

CREATE POLICY "Users can view own ai ledger entries"
ON public.ai_output_ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
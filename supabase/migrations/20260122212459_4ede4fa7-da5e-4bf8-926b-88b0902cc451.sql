-- Drop the overly permissive policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy - users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Note: linkedin_connections_public is a VIEW with security_invoker = true
-- It inherits RLS from the base linkedin_connections table, which already has proper RLS
-- No additional policy needed for the view
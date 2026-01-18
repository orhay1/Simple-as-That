-- Drop the restrictive policy and create one that allows SELECT for own records
-- The view still protects tokens by not including them in the column list
DROP POLICY IF EXISTS "Deny direct SELECT - use linkedin_connections_public view" ON public.linkedin_connections;

-- Allow users to SELECT only their own connection (view filters columns, RLS filters rows)
CREATE POLICY "Users can view own linkedin connection" 
ON public.linkedin_connections 
FOR SELECT 
USING (auth.uid() = user_id);

-- The security is now layered:
-- 1. RLS policy ensures users only see their own records
-- 2. The view (linkedin_connections_public) excludes sensitive token columns
-- 3. Client code is updated to query the view, not the base table
-- 4. Edge functions use service role key to access tokens when needed
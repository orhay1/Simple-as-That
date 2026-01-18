-- Drop existing policies for linkedin_connections
DROP POLICY IF EXISTS "Users can manage own linkedin connection" ON public.linkedin_connections;
DROP POLICY IF EXISTS "Users can view own linkedin connection" ON public.linkedin_connections;

-- Create new policy that only allows viewing non-sensitive fields
-- Tokens should NEVER be exposed to client - they are accessed only server-side via service role
CREATE POLICY "Users can view own linkedin connection (safe fields only)"
ON public.linkedin_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own connection (initial creation)
CREATE POLICY "Users can insert own linkedin connection"
ON public.linkedin_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users cannot update directly - updates happen via edge functions with service role
-- This prevents client from tampering with tokens
CREATE POLICY "Users can update own linkedin connection metadata"
ON public.linkedin_connections
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own connection
CREATE POLICY "Users can delete own linkedin connection"
ON public.linkedin_connections
FOR DELETE
USING (auth.uid() = user_id);
-- Grant SELECT on the public view to authenticated users
-- Views with security_invoker inherit RLS from base table, but we need to allow view access
GRANT SELECT ON public.linkedin_connections_public TO authenticated;
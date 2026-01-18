-- First drop RLS policies that depend on has_role function
DROP POLICY IF EXISTS "Managers can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Editors and managers can create ai entries" ON public.ai_output_ledger;

-- Create a simpler RLS policy for ai_output_ledger that just allows authenticated users
CREATE POLICY "Authenticated users can create ai entries" ON public.ai_output_ledger
FOR INSERT WITH CHECK (true);

-- Drop the handle_new_user trigger that inserts into user_roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate handle_new_user without role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop role-related database functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_any_role(uuid);

-- Drop the user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- Drop the app_role enum type
DROP TYPE IF EXISTS public.app_role;
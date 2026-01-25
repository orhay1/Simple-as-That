-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_user_deletion();

-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the corrected trigger function using net.http_post
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the edge function to delete storage files using pg_net
  PERFORM net.http_post(
    url := 'https://mtoqksifrpvkskhmchwj.supabase.co/functions/v1/cleanup-user-storage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object('user_id', OLD.id)
  );
  
  RETURN OLD;
END;
$$;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();
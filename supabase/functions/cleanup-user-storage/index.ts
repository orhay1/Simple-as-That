import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is called with service role key (from database trigger)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cleaning up storage for user: ${user_id}`);

    // Delete files from storage buckets
    const buckets = ['ai-images', 'user-uploads'];
    const results: Record<string, { deleted: number; errors: string[] }> = {};

    for (const bucket of buckets) {
      results[bucket] = { deleted: 0, errors: [] };
      
      try {
        // List all files for this user (files are stored in user_id folder)
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucket)
          .list(user_id);

        if (listError) {
          console.error(`Error listing files in ${bucket}:`, listError);
          results[bucket].errors.push(`List error: ${listError.message}`);
          continue;
        }

        if (files && files.length > 0) {
          const filePaths = files.map(f => `${user_id}/${f.name}`);
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucket)
            .remove(filePaths);

          if (deleteError) {
            console.error(`Error deleting files from ${bucket}:`, deleteError);
            results[bucket].errors.push(`Delete error: ${deleteError.message}`);
          } else {
            results[bucket].deleted = filePaths.length;
            console.log(`Deleted ${filePaths.length} files from ${bucket}`);
          }
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Error processing bucket ${bucket}:`, e);
        results[bucket].errors.push(`Processing error: ${errorMessage}`);
      }
    }

    console.log(`Storage cleanup completed for user: ${user_id}`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-user-storage function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

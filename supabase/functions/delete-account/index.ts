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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found in token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete all user data from tables (order matters for FK dependencies)
    const tablesToDelete = [
      'publications',
      'post_drafts',
      'ai_output_ledger',
      'ai_news_items',
      'topic_ideas',
      'assets',
      'linkedin_connections',
      'guardrails',
      'settings',
      'voice_profiles',
      'post_templates',
      'profiles',
    ];

    for (const table of tablesToDelete) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        // Continue with other tables even if one fails
      } else {
        console.log(`Deleted user data from ${table}`);
      }
    }

    // Delete files from storage buckets
    const buckets = ['ai-images', 'user-uploads'];
    
    for (const bucket of buckets) {
      try {
        // List all files for this user
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucket)
          .list(userId);
        
        if (listError) {
          console.error(`Error listing files in ${bucket}:`, listError);
          continue;
        }
        
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${userId}/${f.name}`);
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucket)
            .remove(filePaths);
          
          if (deleteError) {
            console.error(`Error deleting files from ${bucket}:`, deleteError);
          } else {
            console.log(`Deleted ${filePaths.length} files from ${bucket}`);
          }
        }
      } catch (e) {
        console.error(`Error processing bucket ${bucket}:`, e);
      }
    }

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

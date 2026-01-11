import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID')!;
const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Publishing post for user: ${user.id}`);

    // Get LinkedIn connection
    const { data: connection, error: connectionError } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_connected', true)
      .single();

    if (connectionError || !connection) {
      console.error('Connection error:', connectionError);
      return new Response(JSON.stringify({ error: 'LinkedIn not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = connection.access_token;
    if (new Date(connection.expires_at) < new Date()) {
      console.log('Token expired, refreshing...');
      
      if (!connection.refresh_token) {
        return new Response(JSON.stringify({ error: 'Token expired and no refresh token available. Please reconnect LinkedIn.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Token refresh failed');
        return new Response(JSON.stringify({ error: 'Failed to refresh token. Please reconnect LinkedIn.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newTokenData = await refreshResponse.json();
      accessToken = newTokenData.access_token;

      // Update stored tokens
      await supabase
        .from('linkedin_connections')
        .update({
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token || connection.refresh_token,
          expires_at: new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      console.log('Token refreshed successfully');
    }

    // Get post content from request body
    const { content, draftId, hashtags } = await req.json();
    
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build full post text with hashtags
    let fullContent = content;
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      fullContent = `${content}\n\n${hashtagString}`;
    }

    console.log('Posting to LinkedIn...');

    // Create LinkedIn post using the UGC API
    const postPayload = {
      author: `urn:li:person:${connection.profile_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: fullContent,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error('LinkedIn post failed:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to publish to LinkedIn', details: errorText }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const postResult = await postResponse.json();
    console.log('Post created successfully:', postResult);

    // Extract post ID and construct URL
    const postId = postResult.id || '';
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    // Update draft status and create publication record if draftId provided
    if (draftId) {
      // Update draft status to published
      await supabase
        .from('post_drafts')
        .update({
          status: 'published',
          published_url: postUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId);

      // Get the draft for publication record
      const { data: draft } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (draft) {
        // Get the image asset URL if exists
        let imageUrl = null;
        if (draft.image_asset_id) {
          const { data: asset } = await supabase
            .from('assets')
            .select('file_url')
            .eq('id', draft.image_asset_id)
            .single();
          imageUrl = asset?.file_url || null;
        }

        // Create publication record with full content for preview
        await supabase
          .from('publications')
          .insert({
            post_draft_id: draftId,
            published_url: postUrl,
            is_manual_publish: false,
            published_at: new Date().toISOString(),
            final_content: {
              title: draft.title,
              body: draft.body,
              hashtags: [...(draft.hashtags_broad || []), ...(draft.hashtags_niche || []), ...(draft.hashtags_trending || [])],
              image_url: imageUrl,
              image_description: draft.image_description,
              language: draft.language || 'en',
            },
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      postUrl,
      postId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LinkedIn post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

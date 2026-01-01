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

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/linkedin-auth`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  console.log(`LinkedIn Auth - Action: ${action}`);

  try {
    // Step 1: Initiate OAuth flow
    if (action === 'authorize') {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const state = btoa(JSON.stringify({ userId, timestamp: Date.now() }));
      const scopes = 'openid profile w_member_social';
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `state=${encodeURIComponent(state)}&` +
        `scope=${encodeURIComponent(scopes)}`;

      console.log('Redirecting to LinkedIn authorization');
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': authUrl,
        },
      });
    }

    // Step 2: Handle OAuth callback
    if (url.searchParams.has('code')) {
      const code = url.searchParams.get('code')!;
      const state = url.searchParams.get('state')!;
      
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        console.error('Invalid state parameter - failed to decode');
        return redirectWithError('Invalid state parameter');
      }

      const { userId, timestamp } = stateData;
      
      // Validate state timestamp (max age: 10 minutes)
      const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
      const stateAge = Date.now() - timestamp;
      
      if (!timestamp || typeof timestamp !== 'number') {
        console.error('Invalid state parameter - missing timestamp');
        return redirectWithError('Invalid authorization state');
      }
      
      if (stateAge > STATE_MAX_AGE_MS) {
        console.error(`State token expired. Age: ${Math.round(stateAge / 1000)}s, Max: ${STATE_MAX_AGE_MS / 1000}s`);
        return redirectWithError('Authorization expired, please try again');
      }
      
      if (stateAge < 0) {
        console.error('State token has future timestamp - possible tampering');
        return redirectWithError('Invalid authorization state');
      }
      
      console.log(`Processing callback for user: ${userId}, state age: ${Math.round(stateAge / 1000)}s`);

      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return redirectWithError('Failed to exchange authorization code');
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful');

      // Get user profile info (userinfo endpoint returns name, picture, sub)
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      let profileName = 'LinkedIn User';
      let profileId = '';
      let avatarUrl = '';
      let headline = '';
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('LinkedIn userinfo response:', JSON.stringify(profileData));
        profileName = profileData.name || profileData.given_name || 'LinkedIn User';
        profileId = profileData.sub || '';
        avatarUrl = profileData.picture || '';
        // Note: headline is not available in userinfo endpoint, but we store it for future use
        headline = profileData.headline || '';
        console.log(`Profile retrieved: ${profileName}, avatar: ${avatarUrl ? 'yes' : 'no'}`);
      }

      // Store tokens in database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      const { error: upsertError } = await supabase
        .from('linkedin_connections')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          profile_id: profileId,
          profile_name: profileName,
          avatar_url: avatarUrl || null,
          headline: headline || null,
          is_connected: true,
          connected_at: new Date().toISOString(),
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Database error:', upsertError);
        return redirectWithError('Failed to save connection');
      }

      console.log('LinkedIn connection saved successfully');
      
      // Redirect back to settings page with success
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${getAppUrl()}/settings?linkedin=connected`,
        },
      });
    }

    // Step 3: Handle disconnect
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'disconnect') {
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
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('linkedin_connections')
          .update({
            is_connected: false,
            access_token: null,
            refresh_token: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Disconnect error:', error);
          return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'refresh') {
        // Token refresh logic
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: connection, error: fetchError } = await supabase
          .from('linkedin_connections')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !connection?.refresh_token) {
          return new Response(JSON.stringify({ error: 'No refresh token available' }), {
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
          return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const newTokenData = await refreshResponse.json();
        const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();

        await supabase
          .from('linkedin_connections')
          .update({
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token || connection.refresh_token,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LinkedIn auth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getAppUrl(): string {
  // Return the app URL - in production this would be configured
  return 'https://mtoqksifrpvkskhmchwj.lovableproject.com';
}

function redirectWithError(message: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${getAppUrl()}/settings?linkedin=error&message=${encodeURIComponent(message)}`,
    },
  });
}

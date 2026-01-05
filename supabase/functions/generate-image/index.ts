import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_IMAGE_MODEL = 'google/gemini-3-pro-image-preview';

interface GenerateImageRequest {
  prompt: string;
  draft_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid token:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has editor or manager role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['editor', 'manager'].includes(roleData.role)) {
      console.error('Insufficient permissions for user:', user.id);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, draft_id }: GenerateImageRequest = await req.json();
    console.log(`Generating image for user ${user.id}, prompt:`, prompt);

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Fetch image model from settings
    const { data: modelSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'image_generation_model')
      .single();

    const selectedModel = modelSetting?.value || DEFAULT_IMAGE_MODEL;
    console.log('Using image model:', selectedModel);

    // Call Lovable AI Gateway for image generation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { 
            role: 'user', 
            content: `Professional LinkedIn post image: ${prompt}. Clean, modern, business-appropriate style.`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      console.error('Lovable AI Gateway error:', error);
      throw new Error(`Lovable AI Gateway error: ${error}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    // Get the base64 data from response
    const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageDataUrl) {
      console.error('No image data in response:', JSON.stringify(data));
      throw new Error('No image data received from Lovable AI');
    }

    // Strip the data URL prefix to get raw base64
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 to binary
    const binaryData = base64Decode(base64Data);
    console.log('Image decoded, size:', binaryData.length, 'bytes');

    // Generate unique filename
    const fileName = `${crypto.randomUUID()}.png`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('ai-images')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ai-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('Image uploaded to storage:', publicUrl);

    // Create asset record with public URL
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        file_url: publicUrl,
        prompt: prompt,
        is_ai_generated: true,
        metadata: { model: selectedModel, storage_path: fileName },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Failed to create asset:', assetError);
      throw assetError;
    }

    // If draft_id provided, link the asset
    if (draft_id && asset) {
      await supabase
        .from('post_drafts')
        .update({ image_asset_id: asset.id })
        .eq('id', draft_id);
    }

    // Log to ledger
    await supabase.from('ai_output_ledger').insert({
      generation_type: 'image',
      user_prompt: prompt,
      raw_output: JSON.stringify({ storage_path: fileName }),
      parsed_output: { image_url: publicUrl, asset_id: asset?.id },
      model: selectedModel,
      created_entity_type: 'assets',
      created_entity_id: asset?.id,
    });

    return new Response(JSON.stringify({ 
      image_url: publicUrl, 
      asset_id: asset?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-image function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

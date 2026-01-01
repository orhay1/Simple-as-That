import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GenerateImageRequest {
  prompt: string;
  draft_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, draft_id }: GenerateImageRequest = await req.json();
    console.log('Generating image for prompt:', prompt);

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Call OpenAI image generation - request b64_json format
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `Professional LinkedIn post image: ${prompt}. Clean, modern, business-appropriate style.`,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI Image API error:', error);
      throw new Error(`OpenAI Image API error: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Get the base64 data from OpenAI response
    const base64Data = data.data[0].b64_json;
    if (!base64Data) {
      throw new Error('No image data received from OpenAI');
    }

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

    // Create asset record with public URL (not base64!)
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        file_url: publicUrl,
        prompt: prompt,
        is_ai_generated: true,
        metadata: { model: 'gpt-image-1', size: '1024x1024', storage_path: fileName },
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
      model: 'gpt-image-1',
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

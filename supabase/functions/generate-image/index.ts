import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_IMAGE_MODEL = 'google/gemini-3-pro-image-preview';

// Input validation
interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

function validatePrompt(prompt: unknown): ValidationResult {
  if (typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a string' };
  }
  
  if (prompt.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }
  
  // Limit prompt length to prevent abuse
  if (prompt.length > 2000) {
    return { valid: false, error: 'Prompt too long (max 2000 chars)' };
  }
  
  // Remove control characters
  const sanitized = prompt
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  
  if (sanitized.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty after sanitization' };
  }
  
  return { valid: true, sanitized };
}

function validateDraftId(draftId: unknown): ValidationResult {
  if (draftId === undefined || draftId === null) {
    return { valid: true, sanitized: undefined };
  }
  
  if (typeof draftId !== 'string') {
    return { valid: false, error: 'Draft ID must be a string' };
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(draftId)) {
    return { valid: false, error: 'Invalid draft ID format' };
  }
  
  return { valid: true, sanitized: draftId };
}

interface GenerateImageRequest {
  prompt: string;
  draft_id?: string;
}

async function generateWithLovableAI(prompt: string, model: string): Promise<string> {
  console.log('Using Lovable AI with model:', model);
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
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
      throw new Error('RATE_LIMIT: Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('PAYMENT_REQUIRED: Payment required, please add funds to your Lovable AI workspace.');
    }
    const error = await response.text();
    throw new Error(`Lovable AI Gateway error: ${error}`);
  }

  const data = await response.json();
  const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageDataUrl) {
    console.error('No image data in response:', JSON.stringify(data));
    throw new Error('No image data received from Lovable AI');
  }

  // Strip the data URL prefix to get raw base64
  return imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  console.log('Using OpenAI DALL-E 3');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY in secrets.');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
  const base64Data = data.data[0].b64_json;
  
  if (!base64Data) {
    throw new Error('No image data received from OpenAI');
  }

  return base64Data;
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

    // User is authenticated, proceed with request
    const requestBody: GenerateImageRequest = await req.json();
    
    // Validate prompt
    const promptValidation = validatePrompt(requestBody.prompt);
    if (!promptValidation.valid) {
      return new Response(JSON.stringify({ error: promptValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate draft_id
    const draftIdValidation = validateDraftId(requestBody.draft_id);
    if (!draftIdValidation.valid) {
      return new Response(JSON.stringify({ error: draftIdValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const prompt = promptValidation.sanitized!;
    const draft_id = draftIdValidation.sanitized;
    
    console.log(`Generating image for user ${user.id}, prompt length: ${prompt.length}`);

    // Fetch image model from settings
    const { data: modelSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'image_generation_model')
      .single();

    // Parse the model value - it may be stored as a JSON string with quotes
    let selectedModel = DEFAULT_IMAGE_MODEL;
    if (modelSetting?.value) {
      const rawValue = modelSetting.value;
      // Handle both JSON-encoded strings and plain strings
      selectedModel = typeof rawValue === 'string' 
        ? rawValue.replace(/^"|"$/g, '') 
        : String(rawValue);
    }
    console.log('Using image model:', selectedModel);

    // Generate image based on selected model
    let base64Data: string;
    
    if (selectedModel === 'openai/gpt-image-1') {
      base64Data = await generateWithOpenAI(prompt);
    } else {
      base64Data = await generateWithLovableAI(prompt, selectedModel);
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

    // Create asset record with public URL
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        file_url: publicUrl,
        prompt: prompt,
        is_ai_generated: true,
        metadata: { model: selectedModel, storage_path: fileName },
        user_id: user.id,
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
    
    // Handle specific error types
    if (error.message?.startsWith('RATE_LIMIT:')) {
      return new Response(JSON.stringify({ error: error.message.replace('RATE_LIMIT: ', '') }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (error.message?.startsWith('PAYMENT_REQUIRED:')) {
      return new Response(JSON.stringify({ error: error.message.replace('PAYMENT_REQUIRED: ', '') }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

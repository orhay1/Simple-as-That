import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ==================== USER API KEYS ====================

interface UserApiKeys {
  gemini: string | null;
  openai: string | null;
}

async function getUserApiKeys(userId: string): Promise<UserApiKeys> {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .eq('user_id', userId)
    .in('key', ['user_api_key_gemini', 'user_api_key_openai']);

  const keys: UserApiKeys = { gemini: null, openai: null };
  
  settings?.forEach(s => {
    let value = s.value;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string
      }
    }
    const keyValue = typeof value === 'string' && value.trim() ? value.trim() : null;
    
    switch (s.key) {
      case 'user_api_key_gemini':
        keys.gemini = keyValue;
        break;
      case 'user_api_key_openai':
        keys.openai = keyValue;
        break;
    }
  });

  return keys;
}

// ==================== INPUT VALIDATION ====================

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
  
  if (prompt.length > 2000) {
    return { valid: false, error: 'Prompt too long (max 2000 chars)' };
  }
  
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
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(draftId)) {
    return { valid: false, error: 'Invalid draft ID format' };
  }
  
  return { valid: true, sanitized: draftId };
}

// ==================== IMAGE GENERATION ====================

// Nano Banana (Free Tier) - uses gemini-2.5-flash-image
async function generateWithNanoBanana(prompt: string, apiKey: string): Promise<string> {
  console.log('Using Nano Banana (Free Tier) - gemini-2.5-flash-image');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Professional LinkedIn post image: ${prompt}. Clean, modern, business-appropriate style.` }] 
        }],
        generationConfig: {
          responseModalities: ["image", "text"],
          imageSafetySettings: "block_low_and_above",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Nano Banana API error:', error);
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Free tier allows 500 images/day. Please try again later.');
    }
    if (response.status === 403) {
      throw new Error('Access denied. Please check your Gemini API key has image generation enabled.');
    }
    if (response.status === 400) {
      if (error.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your API key in Settings → API Keys.');
      }
      throw new Error(`Nano Banana API error: ${error}`);
    }
    throw new Error(`Nano Banana API error: ${error}`);
  }

  const data = await response.json();
  
  // Extract image from generateContent response
  const base64Data = data.candidates?.[0]?.content?.parts
    ?.find((p: any) => p.inlineData)?.inlineData?.data;
  
  if (!base64Data) {
    console.error('Unexpected response structure:', JSON.stringify(data).substring(0, 500));
    throw new Error('No image data received from Nano Banana');
  }
  
  return base64Data;
}

// Nano Banana Pro (Paid Tier) - uses gemini-3-pro-image-preview
async function generateWithNanoBananaPro(prompt: string, apiKey: string): Promise<string> {
  console.log('Using Nano Banana Pro (Paid Tier) - gemini-3-pro-image-preview');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Professional LinkedIn post image: ${prompt}. Clean, modern, business-appropriate style.` }] 
        }],
        generationConfig: {
          responseModalities: ["image", "text"],
          imageSafetySettings: "block_low_and_above",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Nano Banana Pro API error:', error);
    if (response.status === 403) {
      throw new Error('This model requires a paid Gemini API key. Try switching to Nano Banana (free tier) in Settings → Images.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 404) {
      throw new Error('Model not available. Please check your API key has image generation enabled.');
    }
    if (response.status === 400) {
      if (error.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your API key in Settings → API Keys.');
      }
      throw new Error(`Nano Banana Pro API error: ${error}`);
    }
    throw new Error(`Nano Banana Pro API error: ${error}`);
  }

  const data = await response.json();
  
  // Extract image from generateContent response
  const base64Data = data.candidates?.[0]?.content?.parts
    ?.find((p: any) => p.inlineData)?.inlineData?.data;
  
  if (!base64Data) {
    console.error('Unexpected response structure:', JSON.stringify(data).substring(0, 500));
    throw new Error('No image data received from Nano Banana Pro');
  }
  
  return base64Data;
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  console.log('Using OpenAI DALL-E 3');

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key in Settings → API Keys.');
    }
    if (response.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error('OpenAI API access denied. Please check your API key has sufficient credits for DALL-E.');
    }
    throw new Error(`OpenAI Image API error: ${error}`);
  }

  const data = await response.json();
  const base64Data = data.data[0].b64_json;
  
  if (!base64Data) {
    throw new Error('No image data received from OpenAI');
  }

  return base64Data;
}

// ==================== MAIN HANDLER ====================

interface GenerateImageRequest {
  prompt: string;
  draft_id?: string;
  model?: string;
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

    // Get user's API keys
    const userKeys = await getUserApiKeys(user.id);
    console.log(`User ${user.id} keys: gemini=${!!userKeys.gemini}, openai=${!!userKeys.openai}`);

    // Check if user has at least one image generation key
    if (!userKeys.gemini && !userKeys.openai) {
      return new Response(JSON.stringify({ 
        error: 'Image generation requires a Gemini or OpenAI API key. Please configure your keys in Settings → API Keys.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Fetch user's preferred image model
    const { data: modelSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'image_generation_model')
      .eq('user_id', user.id)
      .maybeSingle();

    let selectedModel = 'nano-banana-free'; // Default to free tier
    if (modelSetting?.value) {
      const rawValue = modelSetting.value;
      const modelValue = typeof rawValue === 'string' 
        ? rawValue.replace(/^"|"$/g, '') 
        : String(rawValue);
      
      // Map model names
      if (modelValue.includes('openai') || modelValue.includes('dall')) {
        selectedModel = 'openai';
      } else if (modelValue.includes('nano-banana-pro') || modelValue.includes('pro')) {
        selectedModel = 'nano-banana-pro';
      } else {
        selectedModel = 'nano-banana-free';
      }
    }
    
    // Override with request model if provided
    if (requestBody.model) {
      if (requestBody.model.includes('openai') || requestBody.model.includes('dall')) {
        selectedModel = 'openai';
      } else if (requestBody.model.includes('nano-banana-pro') || requestBody.model.includes('pro')) {
        selectedModel = 'nano-banana-pro';
      } else {
        selectedModel = 'nano-banana-free';
      }
    }

    console.log('Using image model:', selectedModel);

    // Generate image based on selected model and available keys
    let base64Data: string;
    let usedModel: string;
    
    if (selectedModel === 'openai') {
      if (userKeys.openai) {
        base64Data = await generateWithOpenAI(prompt, userKeys.openai);
        usedModel = 'dall-e-3';
      } else if (userKeys.gemini) {
        console.log('OpenAI not available, falling back to Nano Banana');
        base64Data = await generateWithNanoBanana(prompt, userKeys.gemini);
        usedModel = 'nano-banana-free';
      } else {
        throw new Error('DALL-E requires an OpenAI API key. Please configure it in Settings → API Keys.');
      }
    } else if (selectedModel === 'nano-banana-pro') {
      if (userKeys.gemini) {
        base64Data = await generateWithNanoBananaPro(prompt, userKeys.gemini);
        usedModel = 'nano-banana-pro';
      } else if (userKeys.openai) {
        console.log('Gemini not available, falling back to OpenAI');
        base64Data = await generateWithOpenAI(prompt, userKeys.openai);
        usedModel = 'dall-e-3';
      } else {
        throw new Error('Nano Banana Pro requires a Gemini API key.');
      }
    } else {
      // Default: Nano Banana (Free)
      if (userKeys.gemini) {
        base64Data = await generateWithNanoBanana(prompt, userKeys.gemini);
        usedModel = 'nano-banana-free';
      } else if (userKeys.openai) {
        console.log('Gemini not available, falling back to OpenAI');
        base64Data = await generateWithOpenAI(prompt, userKeys.openai);
        usedModel = 'dall-e-3';
      } else {
        throw new Error('Image generation requires a Gemini or OpenAI API key.');
      }
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
        metadata: { model: usedModel, storage_path: fileName },
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
      user_id: user.id,
      generation_type: 'image',
      user_prompt: prompt,
      raw_output: JSON.stringify({ storage_path: fileName }),
      parsed_output: { image_url: publicUrl, asset_id: asset?.id },
      model: usedModel,
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

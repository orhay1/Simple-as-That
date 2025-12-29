import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type GenerationType = 'topics' | 'draft' | 'hashtags' | 'rewrite' | 'image_description';

interface GenerateRequest {
  type: GenerationType;
  inputs?: Record<string, any>;
}

async function getPromptFromSettings(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error || !data) {
    console.log(`No prompt found for key: ${key}`);
    return null;
  }
  
  const value = data.value;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function logToLedger(entry: {
  generation_type: string;
  system_prompt?: string;
  user_prompt?: string;
  inputs?: Record<string, any>;
  raw_output?: string;
  parsed_output?: Record<string, any>;
  model?: string;
  token_usage?: Record<string, any>;
  created_entity_type?: string;
  created_entity_id?: string;
}) {
  const { error } = await supabase.from('ai_output_ledger').insert(entry);
  if (error) console.error('Failed to log to ledger:', error);
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'gpt-4o-mini'
): Promise<{ content: string; usage: any }> {
  console.log(`Calling OpenAI with model: ${model}`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

async function generateTopics(inputs: Record<string, any>) {
  const systemPrompt = await getPromptFromSettings('topic_system_prompt') || 
    `You are a LinkedIn content strategist. Generate engaging topic ideas for professional content.
    Return a JSON array of 5 topics, each with: title, hook, rationale, tags (array of strings).
    Focus on thought leadership, industry insights, and actionable advice.`;
  
  const userPrompt = inputs.context || 
    'Generate 5 engaging LinkedIn topic ideas for a professional audience interested in technology and business.';

  const { content, usage } = await callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini');
  
  // Parse the JSON response
  let topics = [];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      topics = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse topics JSON:', e);
    throw new Error('Failed to parse AI response');
  }

  // Log to ledger
  await logToLedger({
    generation_type: 'topics',
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    inputs,
    raw_output: content,
    parsed_output: { topics },
    model: 'gpt-4o-mini',
    token_usage: usage,
  });

  // Insert topics into database
  const insertedTopics = [];
  for (const topic of topics) {
    const { data, error } = await supabase
      .from('topic_ideas')
      .insert({
        title: topic.title,
        hook: topic.hook,
        rationale: topic.rationale,
        tags: topic.tags || [],
        status: 'new',
      })
      .select()
      .single();
    
    if (data) insertedTopics.push(data);
  }

  return { topics: insertedTopics, usage };
}

async function generateDraft(inputs: Record<string, any>) {
  const { topic_id, title, hook, rationale } = inputs;
  
  const systemPrompt = await getPromptFromSettings('draft_system_prompt') || 
    `You are a LinkedIn content writer. Create engaging, professional posts.
    Write in a conversational yet authoritative tone.
    Structure: Hook (1-2 lines) → Context → Key Points → Call to Action
    Keep posts between 150-300 words. Use line breaks for readability.
    Return JSON with: body (the post content), image_description (for AI image generation).`;

  const userPrompt = `Write a LinkedIn post about:
Title: ${title}
Hook: ${hook || 'Create an engaging hook'}
Context: ${rationale || 'Share professional insights'}`;

  const { content, usage } = await callOpenAI(systemPrompt, userPrompt, 'gpt-4o');

  let parsed = { body: '', image_description: '' };
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed.body = content;
    }
  } catch (e) {
    parsed.body = content;
  }

  // Log to ledger
  await logToLedger({
    generation_type: 'draft',
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    inputs,
    raw_output: content,
    parsed_output: parsed,
    model: 'gpt-4o',
    token_usage: usage,
    created_entity_type: topic_id ? 'post_drafts' : undefined,
  });

  return { draft: parsed, usage };
}

async function generateHashtags(inputs: Record<string, any>) {
  const { body, title } = inputs;
  
  const systemPrompt = await getPromptFromSettings('hashtag_system_prompt') || 
    `You are a LinkedIn SEO expert. Generate relevant hashtags for posts.
    Return JSON with three arrays:
    - hashtags_broad: 2-3 high-volume, general hashtags
    - hashtags_niche: 2-3 industry-specific hashtags
    - hashtags_trending: 1-2 currently trending relevant hashtags`;

  const userPrompt = `Generate hashtags for this LinkedIn post:
Title: ${title}
Content: ${body}`;

  const { content, usage } = await callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini');

  let hashtags = { hashtags_broad: [], hashtags_niche: [], hashtags_trending: [] };
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      hashtags = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse hashtags:', e);
  }

  await logToLedger({
    generation_type: 'hashtags',
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    inputs,
    raw_output: content,
    parsed_output: hashtags,
    model: 'gpt-4o-mini',
    token_usage: usage,
  });

  return { hashtags, usage };
}

async function rewriteContent(inputs: Record<string, any>) {
  const { body, action } = inputs;
  
  const actionPrompts: Record<string, string> = {
    tighten: 'Make this more concise while keeping the key message. Remove filler words.',
    expand: 'Expand this with more detail, examples, or context. Keep it professional.',
    add_cta: 'Add a compelling call-to-action at the end. Make it engaging, not salesy.',
    founder_tone: 'Rewrite in a founder/entrepreneur voice - confident, visionary, authentic.',
    educational_tone: 'Rewrite in an educational tone - informative, clear, helpful.',
    contrarian_tone: 'Rewrite with a contrarian angle - challenge conventional wisdom.',
    story_tone: 'Rewrite as a story - personal narrative, lessons learned.',
  };

  const systemPrompt = 'You are a LinkedIn content editor. Rewrite content as requested. Return only the rewritten text, no explanations.';
  const userPrompt = `${actionPrompts[action] || 'Improve this content.'}\n\nOriginal:\n${body}`;

  const { content, usage } = await callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini');

  await logToLedger({
    generation_type: 'rewrite',
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    inputs,
    raw_output: content,
    parsed_output: { rewritten: content },
    model: 'gpt-4o-mini',
    token_usage: usage,
  });

  return { rewritten: content, usage };
}

async function generateImageDescription(inputs: Record<string, any>) {
  const { title, body } = inputs;
  
  const systemPrompt = `You are a visual content strategist for LinkedIn. Based on a post's content, create a concise image description optimized for AI image generation.
  
  Guidelines:
  - Create a professional, business-appropriate image concept
  - Focus on the key theme or message of the post
  - Use descriptive visual language (colors, composition, mood)
  - Keep it to 1-2 sentences, max 50 words
  - Avoid text in the image, focus on visual metaphors
  - Return only the description, no explanations`;

  const userPrompt = `Create an image description for this LinkedIn post:
Title: ${title}
Content: ${body}`;

  const { content, usage } = await callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini');

  await logToLedger({
    generation_type: 'image_description',
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    inputs,
    raw_output: content,
    parsed_output: { image_description: content.trim() },
    model: 'gpt-4o-mini',
    token_usage: usage,
  });

  return { image_description: content.trim(), usage };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, inputs = {} }: GenerateRequest = await req.json();
    console.log(`Processing ${type} generation request`, inputs);

    let result;
    switch (type) {
      case 'topics':
        result = await generateTopics(inputs);
        break;
      case 'draft':
        result = await generateDraft(inputs);
        break;
      case 'hashtags':
        result = await generateHashtags(inputs);
        break;
      case 'rewrite':
        result = await rewriteContent(inputs);
        break;
      case 'image_description':
        result = await generateImageDescription(inputs);
        break;
      default:
        throw new Error(`Unknown generation type: ${type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

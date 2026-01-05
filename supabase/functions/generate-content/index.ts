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

type GenerationType = 'hashtags' | 'rewrite' | 'image_description';

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

function interpolatePlaceholders(template: string, inputs: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = inputs[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
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
  const customPrompt = await getPromptFromSettings('topic_system_prompt');
  
  const defaultPrompt = `You are a LinkedIn content strategist and thought leader. Your task is to generate compelling topic ideas that drive engagement and establish authority.

## Context
${inputs.context || 'Generate topics for a professional audience interested in technology, AI, and business innovation.'}

## Instructions
Generate exactly 5 LinkedIn post topic ideas. Each topic should:
- Be specific and actionable (not generic advice)
- Have a clear hook that stops the scroll
- Include a compelling angle or unique perspective
- Be relevant to current industry trends and discussions

## Output Format
Return a valid JSON array with exactly 5 topics. Each topic must have:
- "title": A compelling, specific topic title (max 10 words)
- "hook": An attention-grabbing opening line that creates curiosity (1-2 sentences)
- "rationale": Why this topic will resonate with the audience and drive engagement (1-2 sentences)
- "tags": An array of 2-4 relevant topic tags/categories

## Example Structure
[
  {
    "title": "Why Most AI Implementations Fail",
    "hook": "I've seen 47 AI projects this year. Only 3 actually delivered ROI. Here's the pattern I noticed.",
    "rationale": "Contrarian take backed by real experience. Creates curiosity about the pattern.",
    "tags": ["AI", "Digital Transformation", "Leadership"]
  }
]

Return ONLY the JSON array, no additional text or explanation.`;

  const systemPrompt = 'You are a LinkedIn content strategist. Generate topic ideas in the exact JSON format requested.';
  const userPrompt = customPrompt 
    ? interpolatePlaceholders(customPrompt, inputs) 
    : defaultPrompt;

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
  
  const customPrompt = await getPromptFromSettings('draft_system_prompt');
  
  const defaultPrompt = `You are a LinkedIn content writer specializing in creating viral, engaging posts that drive meaningful engagement.

## Topic Details
- Title: ${title}
- Hook Idea: ${hook || 'Create a scroll-stopping hook'}
- Context/Angle: ${rationale || 'Share professional insights with authority'}

## Writing Guidelines

### Structure
1. **Hook (Line 1-2)**: Start with a bold statement, surprising statistic, or thought-provoking question that stops the scroll
2. **Context (Lines 3-5)**: Set up the problem or situation
3. **Value (Lines 6-12)**: Deliver key insights, lessons, or actionable points
4. **Call to Action (Final lines)**: End with engagement prompt (question, invitation to share thoughts)

### Style Rules
- Use short paragraphs (1-2 sentences max)
- Add line breaks between thoughts for readability
- Write conversationally, like talking to a smart friend
- Be specific with examples and numbers when possible
- Avoid corporate jargon and buzzwords
- Use "you" and "I" to create connection
- Keep between 150-250 words

### Engagement Techniques
- Use pattern interrupts
- Create curiosity gaps
- Include relatable moments
- End with an open question

## Output Format
Return a valid JSON object with:
- "body": The complete LinkedIn post content (with proper line breaks using \\n)
- "image_description": A brief description for AI image generation (max 30 words, visual concept only)

Return ONLY the JSON object, no additional text.`;

  const systemPrompt = 'You are a LinkedIn content writer. Create posts in the exact JSON format requested.';
  const userPrompt = customPrompt 
    ? interpolatePlaceholders(customPrompt, inputs) 
    : defaultPrompt;

  const { content, usage } = await callOpenAI(systemPrompt, userPrompt, 'gpt-4o-mini');

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
    model: 'gpt-4o-mini',
    token_usage: usage,
    created_entity_type: topic_id ? 'post_drafts' : undefined,
  });

  return { draft: parsed, usage };
}

async function generateHashtags(inputs: Record<string, any>) {
  const { body, title } = inputs;
  
  const customPrompt = await getPromptFromSettings('hashtag_system_prompt');
  
  const defaultPrompt = `You are a LinkedIn SEO and hashtag strategist. Your task is to generate strategic hashtags that maximize post visibility and reach.

## Post Content
Title: ${title}
Content: ${body}

## Hashtag Strategy

### Categories to Generate
1. **Broad/High-Volume Hashtags** (2-3): General hashtags with large followings for maximum reach
   - Examples: #Leadership, #Innovation, #Technology, #Business
   
2. **Niche/Industry-Specific Hashtags** (2-3): Targeted hashtags for your specific industry or topic
   - More specific = less competition = higher chance of being featured
   
3. **Trending/Timely Hashtags** (1-2): Currently popular or emerging hashtags relevant to the content
   - Can include event-based, seasonal, or trending topic hashtags

### Rules
- Include the # symbol with each hashtag
- Use CamelCase for multi-word hashtags (e.g., #DigitalTransformation)
- Avoid overly generic hashtags like #business or #success alone
- Ensure hashtags are actually used on LinkedIn (not Twitter-only trends)
- Total hashtags should be 5-8 (optimal for LinkedIn engagement)

## Output Format
Return a valid JSON object with:
- "hashtags_broad": Array of 2-3 high-volume hashtags
- "hashtags_niche": Array of 2-3 industry-specific hashtags  
- "hashtags_trending": Array of 1-2 trending relevant hashtags

Return ONLY the JSON object, no additional text.`;

  const systemPrompt = 'You are a LinkedIn SEO expert. Generate hashtags in the exact JSON format requested.';
  const userPrompt = customPrompt 
    ? interpolatePlaceholders(customPrompt, inputs) 
    : defaultPrompt;

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
    tighten: `Rewrite this content to be more concise and impactful.

## Instructions
- Cut unnecessary words, filler phrases, and redundancies
- Keep the core message and key points intact
- Maintain the original tone and voice
- Aim for 20-30% shorter while increasing clarity
- Preserve any specific examples or data points`,

    expand: `Expand this content with more depth and detail.

## Instructions
- Add relevant examples, analogies, or case studies
- Include additional context that strengthens the argument
- Break down complex points into digestible pieces
- Add a specific tip or actionable insight
- Keep the same tone and voice
- Aim for 30-50% longer without being verbose`,

    add_cta: `Add a compelling call-to-action to this content.

## Instructions
- End with an engaging question or invitation
- Make it feel natural, not salesy or forced
- Encourage comments and discussion
- Options: ask for opinions, invite sharing experiences, prompt reflection
- Keep the CTA to 1-2 lines maximum`,

    founder_tone: `Rewrite this in an authentic founder/entrepreneur voice.

## Instructions
- Write with confidence and conviction
- Share as if from personal experience and lessons learned
- Be direct and decisive, not hedging
- Use "I" statements and personal observations
- Sound visionary but grounded
- Maintain professionalism while being relatable`,

    educational_tone: `Rewrite this in an educational, teaching tone.

## Instructions
- Structure information clearly for learning
- Use "Here's what you need to know" framing
- Include actionable takeaways
- Break down complex concepts simply
- Be helpful and approachable
- Sound knowledgeable but not condescending`,

    contrarian_tone: `Rewrite this with a contrarian, thought-provoking angle.

## Instructions  
- Challenge conventional wisdom or common beliefs
- Start with an unexpected take or observation
- Back up the contrarian view with reasoning
- Be bold but not offensive
- Create productive tension that invites discussion
- Avoid being contrarian just for shock value`,

    story_tone: `Rewrite this as a narrative story.

## Instructions
- Lead with a specific moment or situation
- Use sensory details and emotions
- Show the journey from problem to insight
- Include dialogue or internal thoughts if appropriate
- End with the lesson or takeaway
- Make it relatable and human`,
  };

  const systemPrompt = `You are a LinkedIn content editor and writing coach. Your task is to rewrite content according to specific instructions while maintaining the core message.

## Rules
- Return ONLY the rewritten content
- Do not include explanations, notes, or meta-commentary
- Preserve line breaks and formatting style
- Keep the content appropriate for LinkedIn`;

  const userPrompt = `${actionPrompts[action] || 'Improve this content for LinkedIn engagement.'}\n\n## Original Content\n${body}`;

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
  
  const customPrompt = await getPromptFromSettings('image_generator_prompt');
  
  const systemPrompt = `You are a visual content strategist specializing in LinkedIn imagery. Your task is to create image descriptions optimized for AI image generation that will complement professional posts.`;

  const defaultUserPrompt = `Create an image description for AI generation based on this LinkedIn post.

## Post Content
Title: ${title}
Content: ${body}

## Image Guidelines
- Professional and business-appropriate
- Realistic style suitable for LinkedIn (not cartoonish)
- Focus on visual metaphors that represent the core message
- NO text, words, or letters in the image
- Clean, modern aesthetic
- Good for professional/business context

## Style Preferences
- Photorealistic or high-quality illustration style
- Professional lighting and composition
- Colors that evoke trust and professionalism (blues, clean whites, warm accents)
- Can include: people in professional settings, abstract concepts, technology, nature metaphors

## Output
Return ONLY the image description in 1-2 sentences (max 40 words). No explanations or additional text.
Focus on: subject, setting, style, mood, and key visual elements.`;

  const userPrompt = customPrompt 
    ? interpolatePlaceholders(customPrompt, inputs) 
    : defaultUserPrompt;

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

    // Verify user has appropriate role (user or admin)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Allow all authenticated users with a role (backward compat with old roles)
    if (!roleData || !['user', 'admin', 'editor', 'manager'].includes(roleData.role)) {
      console.error('Insufficient permissions for user:', user.id);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, inputs = {} }: GenerateRequest = await req.json();
    console.log(`Processing ${type} generation request for user ${user.id}`, inputs);

    let result;
    switch (type) {
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

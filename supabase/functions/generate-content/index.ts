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

type GenerationType = 'hashtags' | 'hashtags_free' | 'rewrite' | 'image_description' | 'draft';

interface GenerateRequest {
  type: GenerationType;
  inputs?: Record<string, any>;
  language?: string;
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
  // Use 'perplexity_system_prompt' to match Settings UI key
  const customPrompt = await getPromptFromSettings('perplexity_system_prompt');
  
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

async function generateDraft(inputs: Record<string, any>, language: string = 'en') {
  const { title, summary, full_content, source_url } = inputs;
  
  // Use custom GPT instructions from settings or fall back to default
  const customGptInstructions = await getPromptFromSettings('gpt_master_instructions');
  
  const languageNames: Record<string, string> = {
    'en': 'English',
    'he': 'Hebrew (עברית)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'ar': 'Arabic (العربية)',
  };
  const langName = languageNames[language] || language;
  
  // Default GPT instructions (from user's Custom GPT)
  const defaultGptInstructions = `You are a professional content creator specializing in crafting high-quality, humanlike LinkedIn posts in both English and Hebrew. Your primary role is to assist users in generating posts that feel authentic, engaging, and aligned with real human communication patterns seen in top-performing LinkedIn content. Your tone should vary slightly depending on the user's prompt, but must always remain professional, thoughtful, and emotionally intelligent — as if a real person carefully reviewed and refined the writing.

Avoid clichés and patterns that reveal the text was generated by AI. Posts should read as if written by a reflective, articulate human with a clear intention and voice.

✅ Core Principles:

Authenticity Over Perfection
Write in a way that feels personal and slightly imperfect — not robotic or overly polished. Use natural sentence flow, occasional rhetorical questions, and variable sentence length.

Hook–Story–Takeaway Structure
Most posts should follow this format:
- Hook: A short, emotional, or curiosity-driven first sentence that draws the reader in.
- Body: A narrative, insight, or value-driven explanation.
- Close: A clear takeaway, reflection, or call to action — preferably open-ended (e.g. asking a question to invite discussion).

Cultural & Linguistic Awareness
- When writing in Hebrew, adjust tone and phrasing to match Israeli professional culture: more direct, informal-yet-intelligent, optimistic.
- When writing in English, follow global LinkedIn conventions: warm, articulate, and slightly polished.
- You may use light code-switching if the audience supports it (e.g. Hebrew post with 1–2 key English terms).

Human-Like Style Techniques:
- Use first-person voice where appropriate.
- Include light emotion, self-reflection, or storytelling to increase authenticity.
- Vary sentence structure and length naturally.
- Use formatting like short paragraphs, occasional bold for emphasis, bullets or lists when helpful — but sparingly.

🔄 Behavior Guidelines:
- Prioritize value to the reader, not just self-promotion.
- Ensure LinkedIn norms are respected: no hashtags overload, no excessive emojis, no AI-sounding phrases (e.g. "in today's fast-paced digital world…").

📌 Content You Should Create:
- Thoughtful reflections on lessons learned
- Sharing excitement around a new tool, product, or trend — with a human angle
- Quick story with a practical insight
- Commentary on an industry shift, with a clear opinion or takeaway
- Posts that invite discussion by ending with a compelling question`;

  const systemPrompt = customGptInstructions || defaultGptInstructions;

  // Build context-rich user prompt with all research data
  const userPrompt = `Create a LinkedIn post based on this AI tool research:

## Tool/Topic
${title}

## Research Summary
${summary || 'No summary available'}

## Source URL
${source_url || 'Not provided'}

## Full Scraped Content (for additional context)
${full_content ? full_content.substring(0, 3000) : 'Not available'}

---

## Target Language
${language === 'he' ? 'Hebrew (עברית) - Write the ENTIRE post in Hebrew. Keep hashtags in English.' : langName}

## Output Format
Return a valid JSON object with:
- "body": The complete LinkedIn post content (with proper line breaks using \\n). Follow the Hook–Story–Takeaway structure.
- "image_description": A brief visual concept for AI image generation (max 30 words, always in English, describe the visual NOT the tool)

Return ONLY the JSON object, no additional text or explanation.`;

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
  });

  return { draft: parsed, usage };
}

async function generateHashtags(inputs: Record<string, any>) {
  const { body, title } = inputs;
  
  // Use 'hashtag_generator_prompt' to match Settings UI key
  const customPrompt = await getPromptFromSettings('hashtag_generator_prompt');
  
  const defaultPrompt = `You are a LinkedIn hashtag expert. Generate PRECISE, TOOL-SPECIFIC hashtags.

## Post Content
Title: ${title}
Content: ${body}

## CRITICAL INSTRUCTIONS

### Step 1: Extract the EXACT tool/product name
- Look for proper nouns, product names, or AI tool names in the content
- Examples: "Cursor", "Claude", "Midjourney", "Notion AI", "GitHub Copilot"

### Step 2: Generate hashtags following this structure

1. **Tool-Specific Hashtag** (1): Create a hashtag using the EXACT tool name
   - Format: #ToolName or #ToolNameAI
   - Examples: #CursorAI, #ClaudeAI, #Midjourney, #GitHubCopilot
   
2. **Niche Category Hashtags** (2): Specific to what the tool DOES
   - Focus on the tool's primary function
   - Examples: #CodeGeneration, #AIWriting, #ImageGeneration, #AIProductivity
   
3. **Broad Hashtags** (1-2): General tech/AI categories
   - Only include 1-2 at most
   - Examples: #AI, #MachineLearning, #TechTools

### Rules
- MAXIMUM 5 hashtags total (4-5 is ideal)
- First hashtag MUST be the tool name
- Include # symbol with each hashtag
- Use CamelCase for multi-word hashtags
- NO generic hashtags like #innovation, #future, #technology alone

## Output Format
Return a valid JSON object with:
- "hashtags_broad": Array of 1-2 broad category hashtags
- "hashtags_niche": Array of 2-3 specific function hashtags (including the tool name)
- "hashtags_trending": Array of 0-1 trending hashtags (only if truly relevant)

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

// Generate hashtags using Lovable AI (Free tier - Gemini)
async function generateHashtagsFree(inputs: Record<string, any>) {
  const { body, title } = inputs;
  
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const systemPrompt = 'You are a LinkedIn SEO expert. Generate hashtags in the exact JSON format requested.';
  
  const userPrompt = `You are a LinkedIn hashtag expert. Generate PRECISE, TOOL-SPECIFIC hashtags.

## Post Content
Title: ${title}
Content: ${body}

## CRITICAL INSTRUCTIONS

### Step 1: Extract the EXACT tool/product name
- Look for proper nouns, product names, or AI tool names in the content
- Examples: "Cursor", "Claude", "Midjourney", "Notion AI", "GitHub Copilot"

### Step 2: Generate hashtags following this structure

1. **Tool-Specific Hashtag** (1): Create a hashtag using the EXACT tool name
   - Format: #ToolName or #ToolNameAI
   - Examples: #CursorAI, #ClaudeAI, #Midjourney, #GitHubCopilot
   
2. **Niche Category Hashtags** (2): Specific to what the tool DOES
   - Focus on the tool's primary function
   - Examples: #CodeGeneration, #AIWriting, #ImageGeneration, #AIProductivity
   
3. **Broad Hashtags** (1-2): General tech/AI categories
   - Only include 1-2 at most
   - Examples: #AI, #MachineLearning, #TechTools

### Rules
- MAXIMUM 5 hashtags total (4-5 is ideal)
- First hashtag MUST be the tool name
- Include # symbol with each hashtag
- Use CamelCase for multi-word hashtags
- NO generic hashtags like #innovation, #future, #technology alone

## Output Format
Return a valid JSON object with:
- "hashtags_broad": Array of 1-2 broad category hashtags
- "hashtags_niche": Array of 2-3 specific function hashtags (including the tool name)
- "hashtags_trending": Array of 0-1 trending hashtags (only if truly relevant)

Return ONLY the JSON object, no additional text.`;

  console.log('Calling Lovable AI Gateway for hashtags_free');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('API credits exhausted. Please add credits to continue.');
    }
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    throw new Error(`AI generation failed: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Normalize response - handle multiple possible key formats
  let hashtags = { hashtags_broad: [] as string[], hashtags_niche: [] as string[], hashtags_trending: [] as string[] };
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      hashtags = {
        hashtags_broad: parsed.hashtags_broad || parsed.broad_hashtags || parsed.broad || [],
        hashtags_niche: parsed.hashtags_niche || parsed.niche_specific_hashtags || parsed.niche || [],
        hashtags_trending: parsed.hashtags_trending || parsed.trending_hashtags || parsed.trending || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse hashtags:', e);
  }

  await logToLedger({
    generation_type: 'hashtags_free',
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    inputs,
    raw_output: content,
    parsed_output: hashtags,
    model: 'google/gemini-3-flash-preview',
    token_usage: data.usage,
  });

  return { hashtags, usage: data.usage };
}

async function rewriteContent(inputs: Record<string, any>) {
  const { body, action, language = 'en' } = inputs;
  
  const languageNames: Record<string, string> = {
    'en': 'English',
    'he': 'Hebrew (עברית)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'ar': 'Arabic (العربية)',
  };
  const langName = languageNames[language] || language;
  
  const languageInstruction = language !== 'en' 
    ? `\n\n## IMPORTANT: Write the output entirely in ${langName}. Maintain professional ${langName} suitable for LinkedIn.`
    : '';
  
  const actionPrompts: Record<string, string> = {
    tighten: `Rewrite this content to be more concise and impactful.

## Instructions
- Cut unnecessary words, filler phrases, and redundancies
- Keep the core message and key points intact
- Maintain the original tone and voice
- Aim for 20-30% shorter while increasing clarity
- Preserve any specific examples or data points${languageInstruction}`,

    expand: `Expand this content with more depth and detail.

## Instructions
- Add relevant examples, analogies, or case studies
- Include additional context that strengthens the argument
- Break down complex points into digestible pieces
- Add a specific tip or actionable insight
- Keep the same tone and voice
- Aim for 30-50% longer without being verbose${languageInstruction}`,

    add_cta: `Add a compelling call-to-action to this content.

## Instructions
- End with an engaging question or invitation
- Make it feel natural, not salesy or forced
- Encourage comments and discussion
- Options: ask for opinions, invite sharing experiences, prompt reflection
- Keep the CTA to 1-2 lines maximum${languageInstruction}`,

    founder_tone: `Rewrite this in an authentic founder/entrepreneur voice.

## Instructions
- Write with confidence and conviction
- Share as if from personal experience and lessons learned
- Be direct and decisive, not hedging
- Use "I" statements and personal observations
- Sound visionary but grounded
- Maintain professionalism while being relatable${languageInstruction}`,

    educational_tone: `Rewrite this in an educational, teaching tone.

## Instructions
- Structure information clearly for learning
- Use "Here's what you need to know" framing
- Include actionable takeaways
- Break down complex concepts simply
- Be helpful and approachable
- Sound knowledgeable but not condescending${languageInstruction}`,

    contrarian_tone: `Rewrite this with a contrarian, thought-provoking angle.

## Instructions  
- Challenge conventional wisdom or common beliefs
- Start with an unexpected take or observation
- Back up the contrarian view with reasoning
- Be bold but not offensive
- Create productive tension that invites discussion
- Avoid being contrarian just for shock value${languageInstruction}`,

    story_tone: `Rewrite this as a narrative story.

## Instructions
- Lead with a specific moment or situation
- Use sensory details and emotions
- Show the journey from problem to insight
- Include dialogue or internal thoughts if appropriate
- End with the lesson or takeaway
- Make it relatable and human${languageInstruction}`,

    translate_he: `Rewrite this content entirely in Hebrew (עברית) for an Israeli LinkedIn audience.

## Instructions
- Maintain the core message, hook, and structure
- Adapt cultural references and tone for Israeli professionals
- Use natural Hebrew phrasing, not direct translation
- Keep hashtags in English
- The result should feel like it was written by a native Hebrew speaker
- Match Israeli professional culture: direct, informal-yet-intelligent, optimistic`,

    translate_en: `Rewrite this content entirely in English for a global LinkedIn audience.

## Instructions
- Maintain the core message, hook, and structure
- Adapt tone for global professional readers
- Use natural English phrasing, not direct translation
- Keep hashtags in English
- The result should feel like it was written by a native English speaker
- Follow global LinkedIn conventions: warm, articulate, and slightly polished`,
  };

  const systemPrompt = `You are a LinkedIn content editor and writing coach. Your task is to rewrite content according to specific instructions while maintaining the core message.

## Rules
- Return ONLY the rewritten content
- Do not include explanations, notes, or meta-commentary
- Preserve line breaks and formatting style
- Keep the content appropriate for LinkedIn${language !== 'en' ? `\n- Write entirely in ${langName}` : ''}`;

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
  
  const systemPrompt = `You are a visual concept designer for AI tools and technology. Create image descriptions that visually represent the SPECIFIC tool or concept discussed, NOT generic office/workplace scenes.`;

  const defaultUserPrompt = `Create an image description for AI generation based on this LinkedIn post about an AI tool.

## Post Content
Title: ${title}
Content: ${body}

## CRITICAL INSTRUCTIONS

### Step 1: Identify the Subject
- What is the SPECIFIC AI tool or concept being discussed?
- What does this tool DO? (code generation, image creation, data analysis, etc.)

### Step 2: Create a Visual Concept
Focus on ONE of these approaches:
1. **Abstract representation** of the tool's function (data flowing, code transforming, creative process)
2. **Symbolic imagery** representing the problem it solves
3. **Technical visualization** (UI mockup style, workflow diagram aesthetic, futuristic interface)
4. **Output representation** (what the tool creates or enables)

## AVOID (DO NOT USE THESE)
- Generic office environments with people at desks
- Stock photo style business meetings
- People pointing at screens
- Handshakes or corporate imagery
- Generic "professional" scenes

## PREFER
- Clean tech aesthetics (dark mode interfaces, glowing elements)
- Abstract data/code visualizations
- Futuristic minimalist design
- Tool-specific iconography or symbols
- Creative process representations (transformation, generation, flow)

## Output
Return ONLY the image description in 1-2 sentences (max 40 words). 
Make it specific to THIS tool's function. No generic professional imagery.`;

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

    // User is authenticated, proceed with request
    const { type, inputs = {}, language }: GenerateRequest = await req.json();
    console.log(`Processing ${type} generation request for user ${user.id}`, inputs);

    let result;
    switch (type) {
      case 'draft':
        result = await generateDraft(inputs, language || inputs.language || 'en');
        break;
      case 'hashtags':
        result = await generateHashtags(inputs);
        break;
      case 'hashtags_free':
        result = await generateHashtagsFree(inputs);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== USER API KEYS ====================

interface UserApiKeys {
  gemini: string | null;
  openai: string | null;
  perplexity: string | null;
  firecrawl: string | null;
}

async function getUserApiKeys(supabase: any, userId: string): Promise<UserApiKeys> {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .eq('user_id', userId)
    .in('key', ['user_api_key_gemini', 'user_api_key_openai', 'user_api_key_perplexity', 'user_api_key_firecrawl']);

  const keys: UserApiKeys = { gemini: null, openai: null, perplexity: null, firecrawl: null };
  
  settings?.forEach((s: any) => {
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
      case 'user_api_key_perplexity':
        keys.perplexity = keyValue;
        break;
      case 'user_api_key_firecrawl':
        keys.firecrawl = keyValue;
        break;
    }
  });

  return keys;
}

// ==================== INPUT VALIDATION ====================

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

function validateQuery(query: unknown): ValidationResult {
  if (query === undefined || query === null) {
    return { valid: true, sanitized: null };
  }
  
  if (typeof query !== 'string') {
    return { valid: false, error: 'Query must be a string' };
  }
  
  if (query.length > 1000) {
    return { valid: false, error: 'Query too long (max 1000 chars)' };
  }
  
  const sanitized = query
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  
  return { valid: true, sanitized: sanitized || null };
}

function validateCount(count: unknown): ValidationResult {
  if (count === undefined || count === null) {
    return { valid: true, sanitized: 5 };
  }
  
  const numCount = Number(count);
  if (!Number.isInteger(numCount)) {
    return { valid: false, error: 'Count must be an integer' };
  }
  
  if (numCount < 1 || numCount > 20) {
    return { valid: false, error: 'Count must be between 1 and 20' };
  }
  
  return { valid: true, sanitized: numCount };
}

function validateLanguage(lang: unknown): ValidationResult {
  const allowed = ['en', 'he', 'es', 'fr', 'de', 'ar', 'pt', 'ru', 'zh', 'ja'];
  
  if (lang === undefined || lang === null) {
    return { valid: true, sanitized: 'en' };
  }
  
  if (typeof lang !== 'string') {
    return { valid: false, error: 'Language must be a string' };
  }
  
  if (!allowed.includes(lang)) {
    return { valid: false, error: `Invalid language code. Allowed: ${allowed.join(', ')}` };
  }
  
  return { valid: true, sanitized: lang };
}

// ==================== DEFAULT PROMPTS ====================

const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI tools researcher. Find practical AI tools that developers and professionals can use immediately.

OUTPUT FORMAT - Return a JSON array. Each tool must have:
- title: Tool name + one-line hook (max 60 chars)
- summary: Brief 2-sentence description of what it does
- source_url: The tool's DIRECT page URL - must be one of:
  * Official website (e.g., cursor.sh, notion.com)
  * GitHub repo (e.g., github.com/anthropics/claude-code)
  * Direct Taaft tool page: theresanaiforthat.com/ai/{tool-slug}/ (NOT category pages)
  NEVER use: /s/..., /just-released/, /trending/, or any listing/category pages
- tool_name: The exact tool/project name
- tags: 3-5 tags like ["open-source", "llm", "coding", "free"]

CRITICAL URL RULES:
- ONLY include URLs you found in your search results (from citations)
- NEVER fabricate or guess GitHub URLs
- GitHub URLs MUST have DIFFERENT username and repo name (e.g., github.com/anthropics/claude-code)
- NEVER use URLs like github.com/toolname/toolname - these are INVALID
- If you cannot find a verified URL, set source_url to null

FOCUS ON:
- GitHub trending AI repos (include star count)
- Taaft and "There's An AI For That" recent additions
- Tools launched in the last 14 days
- Free or freemium tools with clear practical value

Return ONLY a valid JSON array, no markdown formatting.`;

const DEFAULT_PERPLEXITY_USER_PROMPT = `Find the latest practical AI tools. Focus on ready-to-use tools with good documentation.`;

const DEFAULT_POLISH_PROMPT = `Analyze this AI tool and provide a structured evaluation to help decide if it's worth creating content about.

TOOL: {tool_name}
DATA: {summary}
{context}

Provide the following information in a clear, scannable format:

**Summary**: One sentence explaining what this tool does

**Pricing**: Free / Freemium / Paid / Open-source (state if unknown)

**Target Users**: Who would benefit most (be specific)

**Key Use Cases**:
- Use case 1
- Use case 2
- Use case 3

**Documentation**: Good / Limited / None visible

**Maturity**: GitHub stars, user count, or launch date if available

**Differentiator**: What makes this unique vs alternatives

**Concerns**: Any red flags (early stage, limited features, unclear pricing, etc.)

**Recommendation**: Should this be turned into a LinkedIn post? (Yes/Maybe/No with brief reasoning)

{language_instruction}

Return ONLY the structured evaluation. No additional commentary.`;

// Gemini-specific research prompt (for fallback when no Perplexity)
const GEMINI_RESEARCH_SYSTEM_PROMPT = `You are an AI tools researcher. Search the web for the latest practical AI tools.

Use your web search capability to find real, current AI tools. For each tool you find, provide:
- title: Tool name + brief hook
- summary: 2-sentence description
- source_url: The official URL (must be real, verified URL you found)
- tool_name: Exact name
- tags: 3-5 relevant tags

Focus on:
- Recently launched AI tools (last 2 weeks)
- Tools with clear practical value
- Free or freemium options
- Well-documented projects

Return a JSON array of tools. Be factual - only include tools you actually found with real URLs.`;

// ==================== URL VALIDATION ====================

function validateAndFixSourceUrl(url: string, toolName: string): string {
  if (!url) return url;
  
  const taaftBadPatterns = [
    /theresanaiforthat\.com\/s\//,
    /theresanaiforthat\.com\/just-released/,
    /theresanaiforthat\.com\/trending/,
    /theresanaiforthat\.com\/?\?/,
    /theresanaiforthat\.com\/?$/,
  ];
  
  for (const pattern of taaftBadPatterns) {
    if (pattern.test(url)) {
      const slug = toolName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      console.log(`Fixed bad Taaft URL: ${url} -> https://theresanaiforthat.com/ai/${slug}/`);
      return `https://theresanaiforthat.com/ai/${slug}/`;
    }
  }
  
  return url;
}

function validateGitHubUrl(url: string | null, toolName: string): { valid: boolean; url: string | null; reason?: string } {
  if (!url) {
    return { valid: true, url };
  }
  
  if (!url.includes('github.com')) {
    return { valid: true, url };
  }
  
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (!match) {
    return { valid: false, url: null, reason: 'Invalid GitHub URL format' };
  }
  
  const [, username, repo] = match;
  
  if (username.toLowerCase() === repo.toLowerCase()) {
    console.warn(`Suspicious GitHub URL detected (username=repo): ${url}`);
    return { valid: false, url: null, reason: 'Username matches repo name - likely hallucinated' };
  }
  
  const normalizedTool = toolName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedRepo = repo.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (normalizedUsername === normalizedTool && normalizedRepo === normalizedTool) {
    console.warn(`Likely hallucinated GitHub URL for ${toolName}: ${url}`);
    return { valid: false, url: null, reason: 'Both username and repo match tool name - hallucinated' };
  }
  
  return { valid: true, url };
}

async function verifyGitHubRepoExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

function extractOfficialUrl(content: string, sourceUrl: string): string | null {
  if (!content || !sourceUrl.includes('theresanaiforthat.com')) return null;
  
  const visitPatterns = [
    /\[Visit[^\]]*\]\((https?:\/\/[^)]+)\)/i,
    /\[Go to[^\]]*\]\((https?:\/\/[^)]+)\)/i,
    /\[Official[^\]]*\]\((https?:\/\/[^)]+)\)/i,
    /\[Website[^\]]*\]\((https?:\/\/[^)]+)\)/i,
  ];
  
  for (const pattern of visitPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      if (!match[1].includes('theresanaiforthat.com')) {
        console.log(`Extracted official URL: ${match[1]}`);
        return match[1];
      }
    }
  }
  
  return null;
}

// ==================== AI PROVIDER CALLS ====================

async function callPerplexity(systemPrompt: string, userPrompt: string, apiKey: string): Promise<{ content: string; citations: string[] }> {
  console.log('Calling Perplexity API...');
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      search_recency_filter: 'week',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Perplexity API error:', response.status, errorText);
    if (response.status === 401) {
      throw new Error('Invalid Perplexity API key. Please check your API key in Settings → API Keys.');
    }
    if (response.status === 429) {
      throw new Error('Perplexity rate limit exceeded. Please try again later.');
    }
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    citations: data.citations || [],
  };
}

async function callGeminiWithGrounding(systemPrompt: string, userPrompt: string, apiKey: string): Promise<{ content: string; citations: string[] }> {
  console.log('Calling Gemini with web grounding...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: { temperature: 0.3 },
        tools: [{ google_search: {} }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    if (response.status === 400 && error.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your API key in Settings → API Keys.');
    }
    if (response.status === 429) {
      throw new Error('Gemini rate limit exceeded. Please try again later.');
    }
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Extract grounding metadata for citations
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
  const citations: string[] = [];
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        citations.push(chunk.web.uri);
      }
    });
  }
  
  return { content, citations };
}

async function callGeminiForPolish(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini polish failed: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAIForPolish(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI polish failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's API keys
    const userKeys = await getUserApiKeys(supabase, user.id);
    console.log(`User ${user.id} keys: perplexity=${!!userKeys.perplexity}, gemini=${!!userKeys.gemini}, firecrawl=${!!userKeys.firecrawl}`);

    // Check if user has research capability (Perplexity or Gemini)
    if (!userKeys.perplexity && !userKeys.gemini) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Research requires a Perplexity or Gemini API key. Please configure your keys in Settings → API Keys.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    const requestBody = await req.json();
    
    const queryValidation = validateQuery(requestBody.query);
    if (!queryValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: queryValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const countValidation = validateCount(requestBody.count);
    if (!countValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: countValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const languageValidation = validateLanguage(requestBody.language);
    if (!languageValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: languageValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const query = queryValidation.sanitized;
    const count = countValidation.sanitized;
    const language = languageValidation.sanitized;

    console.log(`Research initiated by user ${user.id}, count: ${count}, language: ${language}`);

    // Fetch custom prompts from user's settings
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .eq('user_id', user.id)
      .in('key', ['perplexity_system_prompt', 'perplexity_user_prompt', 'research_polish_prompt']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => {
      if (typeof s.value === 'string') {
        settingsMap[s.key] = s.value;
      } else if (s.value && typeof s.value === 'object') {
        settingsMap[s.key] = JSON.stringify(s.value);
      }
    });

    // Build prompts
    const baseSystemPrompt = settingsMap['perplexity_system_prompt'] || DEFAULT_PERPLEXITY_SYSTEM_PROMPT;
    const systemPrompt = baseSystemPrompt.replace(/\d+-\d+ tools|\d+ tools/g, `${count} tools`) + `\n\nReturn exactly ${count} tools.`;
    const userPrompt = query || settingsMap['perplexity_user_prompt'] || DEFAULT_PERPLEXITY_USER_PROMPT;
    const polishPrompt = settingsMap['research_polish_prompt'] || DEFAULT_POLISH_PROMPT;

    console.log('Starting AI tools research...');

    // Step 1: Research - Use Perplexity if available, else Gemini with grounding
    let researchContent = '';
    let citations: string[] = [];

    if (userKeys.perplexity) {
      const result = await callPerplexity(systemPrompt, userPrompt, userKeys.perplexity);
      researchContent = result.content;
      citations = result.citations;
    } else if (userKeys.gemini) {
      const result = await callGeminiWithGrounding(GEMINI_RESEARCH_SYSTEM_PROMPT + `\n\nFind exactly ${count} tools.`, userPrompt, userKeys.gemini);
      researchContent = result.content;
      citations = result.citations;
    }

    // Parse the JSON from response
    let newsItems: any[] = [];
    try {
      const jsonMatch = researchContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      } else {
        newsItems = JSON.parse(researchContent);
      }
    } catch (parseError) {
      console.error('Failed to parse research response as JSON:', parseError);
      console.log('Raw content:', researchContent);
      newsItems = [{
        title: 'AI Tools Summary',
        summary: researchContent.substring(0, 500),
        source_url: citations[0] || null,
        tool_name: null,
        tags: ['ai', 'tools']
      }];
    }

    console.log(`Parsed ${newsItems.length} tools from research`);

    // Step 2: Enrich with Firecrawl (only if user has Firecrawl key)
    const enrichedItems = [];
    
    for (const item of newsItems) {
      let enrichedItem = {
        ...item,
        full_content: null,
        official_url: null,
        raw_perplexity_response: { content: researchContent },
        raw_firecrawl_response: null,
        polished_summary: null,
      };

      // Validate and fix source URL
      const toolName = item.tool_name || item.title || '';
      enrichedItem.source_url = validateAndFixSourceUrl(enrichedItem.source_url || item.source_url, toolName);

      // Validate GitHub URLs
      const githubValidation = validateGitHubUrl(enrichedItem.source_url, toolName);
      if (!githubValidation.valid) {
        console.log(`Discarding invalid GitHub URL for ${toolName}: ${githubValidation.reason}`);
        enrichedItem.source_url = null;
        
        if (citations.length > 0) {
          const fallbackUrl = citations.find((c: string) => 
            c.includes('github.com') || 
            c.toLowerCase().includes(toolName.toLowerCase().replace(/[^a-z0-9]/g, ''))
          );
          if (fallbackUrl) {
            const fallbackValidation = validateGitHubUrl(fallbackUrl, toolName);
            if (fallbackValidation.valid) {
              console.log(`Using fallback citation URL: ${fallbackUrl}`);
              enrichedItem.source_url = fallbackUrl;
            }
          }
        }
      } else if (enrichedItem.source_url?.includes('github.com')) {
        const exists = await verifyGitHubRepoExists(enrichedItem.source_url);
        if (!exists) {
          console.log(`GitHub repo does not exist: ${enrichedItem.source_url}`);
          enrichedItem.source_url = null;
        }
      }

      // Only scrape if user has Firecrawl key
      if (enrichedItem.source_url && userKeys.firecrawl) {
        try {
          console.log(`Fetching additional info from: ${enrichedItem.source_url}`);
          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userKeys.firecrawl}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: enrichedItem.source_url,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          if (firecrawlResponse.ok) {
            const firecrawlData = await firecrawlResponse.json();
            const rawContent = firecrawlData.data?.markdown || firecrawlData.markdown || null;
            
            if (rawContent) {
              enrichedItem.full_content = rawContent.substring(0, 2000);
              
              const officialUrl = extractOfficialUrl(rawContent, enrichedItem.source_url || '');
              if (officialUrl) {
                enrichedItem.official_url = officialUrl;
              }
            }
            enrichedItem.raw_firecrawl_response = firecrawlData;
            console.log(`Successfully fetched content for: ${item.title}`);
          } else {
            console.warn(`Firecrawl failed for ${enrichedItem.source_url}: ${firecrawlResponse.status}`);
          }
        } catch (scrapeError) {
          console.warn(`Error fetching ${item.source_url}:`, scrapeError);
        }
      } else if (!userKeys.firecrawl) {
        console.log(`Skipping scrape for ${item.title} - no Firecrawl key configured`);
      }

      // Step 3: Polish the summary with AI
      const polishKey = userKeys.gemini || userKeys.openai;
      if (polishKey) {
        try {
          console.log(`Polishing summary for: ${item.title}`);
          
          const languageNames: Record<string, string> = {
            'en': '',
            'he': 'Write this evaluation entirely in Hebrew.',
            'es': 'Write this evaluation entirely in Spanish.',
            'fr': 'Write this evaluation entirely in French.',
            'de': 'Write this evaluation entirely in German.',
            'ar': 'Write this evaluation entirely in Arabic.',
          };
          const languageInstruction = languageNames[language] || '';
          
          const contextLine = enrichedItem.full_content ? `CONTEXT: ${enrichedItem.full_content.substring(0, 1000)}` : '';
          const filledPolishPrompt = polishPrompt
            .replace('{tool_name}', item.tool_name || item.title)
            .replace('{summary}', typeof item.summary === 'object' ? JSON.stringify(item.summary) : item.summary)
            .replace('{context}', contextLine)
            .replace('{language_instruction}', languageInstruction);

          let polishedText = '';
          if (userKeys.gemini) {
            polishedText = await callGeminiForPolish(filledPolishPrompt, userKeys.gemini);
          } else if (userKeys.openai) {
            polishedText = await callOpenAIForPolish(filledPolishPrompt, userKeys.openai);
          }
          
          if (polishedText) {
            enrichedItem.polished_summary = polishedText.trim();
            console.log(`Successfully polished summary for: ${item.title}`);
          }
        } catch (polishError) {
          console.warn(`Error polishing ${item.title}:`, polishError);
        }
      }

      enrichedItems.push(enrichedItem);
    }

    // Step 4: Store in database
    console.log('Storing tools in database...');
    const insertData = enrichedItems.map(item => ({
      title: item.title || 'Untitled Tool',
      summary: item.polished_summary || (typeof item.summary === 'object' ? JSON.stringify(item.summary) : item.summary) || null,
      full_content: item.full_content || null,
      source_url: item.source_url || null,
      official_url: item.official_url || null,
      source_name: item.source_name || null,
      tool_name: item.tool_name || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      status: 'new',
      raw_perplexity_response: item.raw_perplexity_response,
      raw_firecrawl_response: item.raw_firecrawl_response,
      user_id: user.id,
    }));

    const { data: savedItems, error: insertError } = await supabase
      .from('ai_news_items')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save tools' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully saved ${savedItems?.length || 0} AI tools`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        items: savedItems,
        citations,
        message: `Discovered ${savedItems?.length || 0} AI tools${!userKeys.firecrawl ? ' (no scraping - add Firecrawl key for detailed content)' : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Research error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

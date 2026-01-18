import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation utilities
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
  
  // Limit query length
  if (query.length > 1000) {
    return { valid: false, error: 'Query too long (max 1000 chars)' };
  }
  
  // Remove control characters
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

// Improved default prompts focused on practical AI tools
const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI tools researcher. Find practical AI tools that developers and professionals can use immediately.

OUTPUT FORMAT - Return a JSON array. Each tool must have:
- title: Tool name + one-line hook (max 60 chars)
- summary: Brief 2-sentence description of what it does
- source_url: The tool's DIRECT page URL - must be one of:
  * Official website (e.g., cursor.sh, notion.com)
  * GitHub repo (e.g., github.com/user/repo)
  * Direct Taaft tool page: theresanaiforthat.com/ai/{tool-slug}/ (NOT category pages)
  NEVER use: /s/..., /just-released/, /trending/, or any listing/category pages
- tool_name: The exact tool/project name
- tags: 3-5 tags like ["open-source", "llm", "coding", "free"]

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

// Validate and fix Taaft URLs that point to category pages instead of direct tool pages
function validateAndFixSourceUrl(url: string, toolName: string): string {
  if (!url) return url;
  
  // Detect Taaft category/listing URLs that need fixing
  const taaftBadPatterns = [
    /theresanaiforthat\.com\/s\//,
    /theresanaiforthat\.com\/just-released/,
    /theresanaiforthat\.com\/trending/,
    /theresanaiforthat\.com\/?\?/,
    /theresanaiforthat\.com\/?$/,
  ];
  
  for (const pattern of taaftBadPatterns) {
    if (pattern.test(url)) {
      // Generate the correct tool URL from the tool name
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

// Extract official tool URL from Firecrawl scraped content
function extractOfficialUrl(content: string, sourceUrl: string): string | null {
  if (!content || !sourceUrl.includes('theresanaiforthat.com')) return null;
  
  // Look for "Visit" links in the markdown content
  const visitPatterns = [
    /\[Visit[^\]]*\]\((https?:\/\/[^)]+)\)/i,
    /\[Go to[^\]]*\]\((https?:\/\/[^)]+)\)/i,
    /\[Official[^\]]*\]\((https?:\/\/[^)]+)\)/i,
    /\[Website[^\]]*\]\((https?:\/\/[^)]+)\)/i,
  ];
  
  for (const pattern of visitPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      // Filter out internal taaft links
      if (!match[1].includes('theresanaiforthat.com')) {
        console.log(`Extracted official URL: ${match[1]}`);
        return match[1];
      }
    }
  }
  
  return null;
}

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

    // Check user role - allow both 'manager' (old) and 'admin' (new) roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = roleData?.role;
    if (!userRole || (userRole !== 'manager' && userRole !== 'admin')) {
      console.error('Insufficient permissions for user:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin role required for research' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    
    // Validate inputs
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
    
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!perplexityKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Research initiated by user ${user.id}, count: ${count}, language: ${language}`);

    // Fetch custom prompts from settings
    console.log('Fetching custom prompts from settings...');
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['perplexity_system_prompt', 'perplexity_user_prompt', 'research_polish_prompt']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(s => {
      if (typeof s.value === 'string') {
        settingsMap[s.key] = s.value;
      } else if (s.value && typeof s.value === 'object') {
        settingsMap[s.key] = JSON.stringify(s.value);
      }
    });

    // Build system prompt with count
    const baseSystemPrompt = settingsMap['perplexity_system_prompt'] || DEFAULT_PERPLEXITY_SYSTEM_PROMPT;
    const systemPrompt = baseSystemPrompt.replace(/\d+-\d+ tools|\d+ tools/g, `${count} tools`) + `\n\nReturn exactly ${count} tools.`;
    const userPrompt = query || settingsMap['perplexity_user_prompt'] || DEFAULT_PERPLEXITY_USER_PROMPT;
    const polishPrompt = settingsMap['research_polish_prompt'] || DEFAULT_POLISH_PROMPT;

    console.log('Starting AI tools research with prompts:', {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      usingCustomSystem: !!settingsMap['perplexity_system_prompt'],
      usingCustomUser: !!query || !!settingsMap['perplexity_user_prompt']
    });

    // Step 1: Search with Perplexity
    console.log('Calling Perplexity API...');
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
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

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Perplexity API error: ${perplexityResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    console.log('Perplexity response received');
    
    const content = perplexityData.choices?.[0]?.message?.content || '';
    const citations = perplexityData.citations || [];
    
    // Parse the JSON from Perplexity response
    let newsItems: any[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array, try parsing the whole content
        newsItems = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response as JSON:', parseError);
      console.log('Raw content:', content);
      // Create a single item from the text response
      newsItems = [{
        title: 'AI Tools Summary',
        summary: content.substring(0, 500),
        source_url: citations[0] || null,
        tool_name: null,
        tags: ['ai', 'tools']
      }];
    }

    console.log(`Parsed ${newsItems.length} tools from Perplexity`);

    // Step 2: Optionally enrich with Firecrawl for additional context
    const enrichedItems = [];
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    for (const item of newsItems) {
      let enrichedItem = {
        ...item,
        full_content: null,
        raw_perplexity_response: perplexityData,
        raw_firecrawl_response: null,
        polished_summary: null,
      };

      // Validate and fix source URL (especially for Taaft category pages)
      const toolName = item.tool_name || item.title || '';
      enrichedItem.source_url = validateAndFixSourceUrl(enrichedItem.source_url || item.source_url, toolName);

      // Only scrape if we have Firecrawl key and a source URL
      if (enrichedItem.source_url && firecrawlKey) {
        try {
          console.log(`Fetching additional info from: ${enrichedItem.source_url}`);
          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
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
            
            // Clean and limit the content
            if (rawContent) {
              enrichedItem.full_content = rawContent.substring(0, 2000);
              
              // Extract official tool URL from Taaft pages
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
      }

      // Step 3: Polish the summary with AI to make it human-readable
      if (lovableApiKey) {
        try {
          console.log(`Polishing summary for: ${item.title}`);
          
          // Language instruction for non-English content
          const languageNames: Record<string, string> = {
            'en': '',
            'he': 'Write this evaluation entirely in Hebrew.',
            'es': 'Write this evaluation entirely in Spanish.',
            'fr': 'Write this evaluation entirely in French.',
            'de': 'Write this evaluation entirely in German.',
            'ar': 'Write this evaluation entirely in Arabic.',
            'pt': 'Write this evaluation entirely in Portuguese.',
            'ru': 'Write this evaluation entirely in Russian.',
            'zh': 'Write this evaluation entirely in Chinese.',
            'ja': 'Write this evaluation entirely in Japanese.',
          };
          const languageInstruction = languageNames[language] || '';
          
          // Use the customizable polish prompt with increased context (1000 chars)
          const contextLine = enrichedItem.full_content ? `CONTEXT: ${enrichedItem.full_content.substring(0, 1000)}` : '';
          const filledPolishPrompt = polishPrompt
            .replace('{tool_name}', item.tool_name || item.title)
            .replace('{summary}', typeof item.summary === 'object' ? JSON.stringify(item.summary) : item.summary)
            .replace('{context}', contextLine)
            .replace('{language_instruction}', languageInstruction);

          const aiPolishResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: 'user', content: filledPolishPrompt }
              ],
            }),
          });

          if (aiPolishResponse.ok) {
            const polishData = await aiPolishResponse.json();
            const polishedText = polishData.choices?.[0]?.message?.content;
            if (polishedText) {
              enrichedItem.polished_summary = polishedText.trim();
              console.log(`Successfully polished summary for: ${item.title}`);
            }
          } else {
            const errorText = await aiPolishResponse.text();
            console.warn(`AI polish failed for ${item.title}: ${aiPolishResponse.status}`, errorText);
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
      // Use polished summary if available, otherwise fall back to original
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
        message: `Discovered ${savedItems?.length || 0} AI tools`
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

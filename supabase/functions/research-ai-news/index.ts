import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default prompts - can be overridden via settings
const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI industry analyst and researcher specializing in artificial intelligence tools, platforms, and industry developments. Your task is to find and analyze the most significant, recent AI news that would resonate with a professional LinkedIn audience.

RESEARCH FOCUS:
- New AI tool launches and major feature updates
- Funding rounds and acquisitions in the AI space
- Breakthrough research papers with practical applications
- Enterprise AI adoption stories and case studies
- Open source AI releases and community developments
- AI policy and regulatory developments with business impact

OUTPUT REQUIREMENTS:
For each news item, provide:
1. title: A clear, compelling headline (max 100 chars) that captures the essence
2. summary: A 2-3 sentence summary explaining:
   - What happened/was announced
   - Why it matters for professionals
   - Key implications or opportunities
3. source_url: The primary, authoritative source URL (prefer official announcements, reputable tech publications)
4. tool_name: The specific AI tool, company, or platform involved (if applicable)
5. tags: An array of 3-5 relevant tags from categories like:
   - Technology type: ["llm", "image-generation", "video-ai", "voice-ai", "agents", "rag", "fine-tuning"]
   - Use case: ["productivity", "coding", "creative", "enterprise", "research", "automation"]
   - Category: ["launch", "update", "funding", "open-source", "research", "regulation"]

QUALITY CRITERIA:
- Prioritize news from the last 7 days
- Focus on actionable insights, not just announcements
- Avoid rumors or unverified claims
- Prefer items with clear business or practical relevance
- Include a mix of big tech and innovative startups

Return a JSON array of 5-7 high-quality news items. No markdown formatting, just the raw JSON array.`;

const DEFAULT_PERPLEXITY_USER_PROMPT = `Find the latest and most significant AI tools, launches, and updates from this week. Focus on:
1. Major product launches or significant feature updates from AI companies
2. Notable funding rounds or acquisitions
3. Open source releases that developers should know about
4. Interesting use cases or adoption stories

Prioritize items that would make engaging LinkedIn content for a tech-savvy professional audience.`;

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

    // Verify user has manager role (research uses API credits)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'manager') {
      console.error('Insufficient permissions for user:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Manager role required for research' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query } = await req.json();
    
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!perplexityKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Research initiated by user ${user.id}`);

    // Fetch custom prompts from settings
    console.log('Fetching custom prompts from settings...');
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['perplexity_system_prompt', 'perplexity_user_prompt']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(s => {
      if (typeof s.value === 'string') {
        settingsMap[s.key] = s.value;
      } else if (s.value && typeof s.value === 'object') {
        settingsMap[s.key] = JSON.stringify(s.value);
      }
    });

    const systemPrompt = settingsMap['perplexity_system_prompt'] || DEFAULT_PERPLEXITY_SYSTEM_PROMPT;
    const userPrompt = query || settingsMap['perplexity_user_prompt'] || DEFAULT_PERPLEXITY_USER_PROMPT;

    console.log('Starting AI news research with prompts:', {
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
        title: 'AI News Summary',
        summary: content.substring(0, 500),
        source_url: citations[0] || null,
        tool_name: null,
        tags: ['ai', 'news']
      }];
    }

    console.log(`Parsed ${newsItems.length} news items from Perplexity`);

    // Step 2: Scrape full content with Firecrawl for each item
    const enrichedItems = [];
    
    for (const item of newsItems) {
      let enrichedItem = {
        ...item,
        full_content: null,
        raw_perplexity_response: perplexityData,
        raw_firecrawl_response: null,
      };

      if (item.source_url && firecrawlKey) {
        try {
          console.log(`Scraping URL with Firecrawl: ${item.source_url}`);
          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: item.source_url,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          if (firecrawlResponse.ok) {
            const firecrawlData = await firecrawlResponse.json();
            enrichedItem.full_content = firecrawlData.data?.markdown || firecrawlData.markdown || null;
            enrichedItem.raw_firecrawl_response = firecrawlData;
            console.log(`Successfully scraped content for: ${item.title}`);
          } else {
            console.warn(`Firecrawl failed for ${item.source_url}: ${firecrawlResponse.status}`);
          }
        } catch (scrapeError) {
          console.warn(`Error scraping ${item.source_url}:`, scrapeError);
        }
      }

      enrichedItems.push(enrichedItem);
    }

    // Step 3: Store in database
    console.log('Storing news items in database...');
    const insertData = enrichedItems.map(item => ({
      title: item.title || 'Untitled',
      summary: item.summary || null,
      full_content: item.full_content || null,
      source_url: item.source_url || null,
      source_name: item.source_name || null,
      tool_name: item.tool_name || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      status: 'new',
      raw_perplexity_response: item.raw_perplexity_response,
      raw_firecrawl_response: item.raw_firecrawl_response,
    }));

    const { data: savedItems, error: insertError } = await supabase
      .from('ai_news_items')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save news items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully saved ${savedItems?.length || 0} news items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        items: savedItems,
        citations,
        message: `Discovered ${savedItems?.length || 0} AI news items`
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

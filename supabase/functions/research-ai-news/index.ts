import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved default prompts focused on practical AI tools
const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI tools researcher and analyst. Your task is to find and analyze practical AI tools that developers and professionals can use.

RESEARCH FOCUS:
- New AI tools launched on GitHub, Product Hunt, or dedicated AI tool directories
- Practical tools from Taaft, There's An AI For That, and similar directories
- Open source AI projects gaining traction
- AI-powered developer tools and productivity apps

OUTPUT REQUIREMENTS:
For each tool, provide a structured analysis:
1. title: Clear tool name and one-line description (max 80 chars)
2. summary: A structured summary including:
   - What it does (2-3 sentences)
   - How to use it (key features/workflow)
   - Main benefits and use cases
   - Any notable limitations or requirements
3. source_url: The official website, GitHub repo, or authoritative source
4. tool_name: The specific tool/project name
5. tags: Array of 3-5 tags like ["open-source", "llm", "coding", "productivity", "free", "api"]

QUALITY CRITERIA:
- Prioritize tools launched or updated in the last 14 days
- Focus on tools with clear practical value
- Include GitHub stars/forks for open-source projects when available
- Note pricing (free, freemium, paid) when relevant
- Prefer tools with good documentation

Return a JSON array of 5-7 tools. No markdown, just the JSON array.`;

const DEFAULT_PERPLEXITY_USER_PROMPT = `Find the latest practical AI tools from:
1. GitHub trending AI repositories
2. Taaft and "There's An AI For That" recent additions
3. Product Hunt AI launches
4. Notable open-source AI projects

Focus on tools that are:
- Ready to use (not just research papers)
- Well-documented
- Solve real problems for developers, creators, or professionals

Provide structured information for creating engaging LinkedIn posts about each tool.`;

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

      // Only scrape if we have Firecrawl key and a source URL
      if (item.source_url && firecrawlKey) {
        try {
          console.log(`Fetching additional info from: ${item.source_url}`);
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
            const rawContent = firecrawlData.data?.markdown || firecrawlData.markdown || null;
            
            // Clean and limit the content
            if (rawContent) {
              enrichedItem.full_content = rawContent.substring(0, 2000);
            }
            enrichedItem.raw_firecrawl_response = firecrawlData;
            console.log(`Successfully fetched content for: ${item.title}`);
          } else {
            console.warn(`Firecrawl failed for ${item.source_url}: ${firecrawlResponse.status}`);
          }
        } catch (scrapeError) {
          console.warn(`Error fetching ${item.source_url}:`, scrapeError);
        }
      }

      // Step 3: Polish the summary with AI to make it human-readable
      if (lovableApiKey) {
        try {
          console.log(`Polishing summary for: ${item.title}`);
          
          const polishPrompt = `You are a professional LinkedIn content writer. Transform the following AI tool research into a compelling, human-readable summary.

TOOL DATA:
- Name: ${item.tool_name || item.title}
- Raw Summary: ${typeof item.summary === 'object' ? JSON.stringify(item.summary) : item.summary}
${enrichedItem.full_content ? `- Additional Context: ${enrichedItem.full_content.substring(0, 1000)}` : ''}

Write a 3-4 paragraph summary that:
1. Opens with an engaging hook about what problem this tool solves
2. Explains how it works in accessible language (avoid technical jargon unless necessary)
3. Highlights 2-3 key benefits with real-world examples
4. Ends with who should consider using this tool

Style guidelines:
- Professional but conversational, like explaining to a colleague over coffee
- Use active voice and storytelling
- Avoid generic phrases like "This tool is..." or "It provides..."
- Include any notable stats (GitHub stars, user count) if available
- Keep it concise but engaging

Return ONLY the polished summary text, no JSON, no formatting, no headers.`;

          const polishResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'user', content: polishPrompt }
              ],
            }),
          });

          if (polishResponse.ok) {
            const polishData = await polishResponse.json();
            const polishedText = polishData.choices?.[0]?.message?.content;
            if (polishedText) {
              enrichedItem.polished_summary = polishedText.trim();
              console.log(`Successfully polished summary for: ${item.title}`);
            }
          } else {
            const errorText = await polishResponse.text();
            console.warn(`AI polish failed for ${item.title}: ${polishResponse.status}`, errorText);
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

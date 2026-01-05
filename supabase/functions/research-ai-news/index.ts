import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query = 'latest AI tools launches and updates this week' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!perplexityKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting AI news research with query:', query);

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
          {
            role: 'system',
            content: `You are an AI news researcher. Find the latest AI tools, launches, and significant updates. For each item, provide:
- title: Clear, descriptive title
- summary: 2-3 sentence summary of what it is and why it matters
- source_url: The primary source URL (must be a valid URL)
- tool_name: The name of the AI tool or company if applicable
- tags: Array of relevant tags like ["llm", "image-generation", "productivity"]

Return a JSON array of 3-5 news items. Focus on actionable, interesting items that would make good LinkedIn content for a tech audience.`
          },
          {
            role: 'user',
            content: query
          }
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

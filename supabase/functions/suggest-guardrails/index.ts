import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    
    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Context is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert content strategist helping define guardrails for professional content creation.
Based on the user's context (industry, audience, goals), suggest:
1. Banned phrases - words/phrases that should never appear (spam triggers, unprofessional language, hype words)
2. Disclaimers - required disclaimers for compliance or professionalism
3. Rules - general content guidelines

Be specific and practical. Focus on quality and professionalism.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please suggest content guardrails for the following context:\n\n${context}` },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_guardrails',
              description: 'Suggest content guardrails including banned phrases, disclaimers, and rules',
              parameters: {
                type: 'object',
                properties: {
                  banned_phrases: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Words or phrases that should never appear in content (e.g., "guaranteed results", "act now", "limited time")',
                  },
                  disclaimers: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required disclaimers for compliance or professionalism',
                  },
                  rules: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'General content guidelines and recommendations',
                  },
                },
                required: ['banned_phrases', 'disclaimers', 'rules'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_guardrails' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'suggest_guardrails') {
      throw new Error('Unexpected AI response format');
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-guardrails:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

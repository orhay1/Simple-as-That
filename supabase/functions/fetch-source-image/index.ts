import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractImageFromUrl(url: string): Promise<string | null> {
  console.log(`Fetching page: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkedInContentBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Try to find Open Graph image
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      console.log(`Found og:image: ${ogImageMatch[1]}`);
      return ogImageMatch[1];
    }

    // Try Twitter card image
    const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                              html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    
    if (twitterImageMatch && twitterImageMatch[1]) {
      console.log(`Found twitter:image: ${twitterImageMatch[1]}`);
      return twitterImageMatch[1];
    }

    // Try to find a prominent image (first large image in the page)
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+(?:\.png|\.jpg|\.jpeg|\.webp))["'][^>]*>/i);
    
    if (imgMatch && imgMatch[1]) {
      // Make sure it's an absolute URL
      const imgUrl = imgMatch[1].startsWith('http') 
        ? imgMatch[1] 
        : new URL(imgMatch[1], url).toString();
      console.log(`Found fallback image: ${imgUrl}`);
      return imgUrl;
    }

    console.log('No suitable image found on page');
    return null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

async function downloadAndStoreImage(imageUrl: string, draftId: string): Promise<{ assetId: string; fileUrl: string } | null> {
  console.log(`Downloading image: ${imageUrl}`);
  
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkedInContentBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Determine file extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';

    const fileName = `source-${draftId}-${Date.now()}.${extension}`;
    const filePath = `source-images/${fileName}`;

    console.log(`Uploading to storage: ${filePath}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ai-images')
      .upload(filePath, uint8Array, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ai-images')
      .getPublicUrl(filePath);

    console.log(`Image uploaded, public URL: ${publicUrl}`);

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        file_url: publicUrl,
        is_ai_generated: false,
        prompt: `Fetched from source: ${imageUrl}`,
        metadata: {
          source_url: imageUrl,
          draft_id: draftId,
          fetched_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset creation error:', assetError);
      return null;
    }

    return { assetId: asset.id, fileUrl: publicUrl };
  } catch (error) {
    console.error('Error downloading/storing image:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { source_url, draft_id } = await req.json();

    if (!source_url || !draft_id) {
      return new Response(JSON.stringify({ error: 'source_url and draft_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing request: source_url=${source_url}, draft_id=${draft_id}`);

    // Extract image URL from the source page
    const imageUrl = await extractImageFromUrl(source_url);
    
    if (!imageUrl) {
      return new Response(JSON.stringify({ 
        error: 'No suitable image found on the source page',
        source_url 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download and store the image
    const result = await downloadAndStoreImage(imageUrl, draft_id);

    if (!result) {
      return new Response(JSON.stringify({ 
        error: 'Failed to download or store the image',
        image_url: imageUrl 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the draft with the new asset
    const { error: updateError } = await supabase
      .from('post_drafts')
      .update({ image_asset_id: result.assetId })
      .eq('id', draft_id);

    if (updateError) {
      console.error('Failed to update draft:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      asset_id: result.assetId,
      file_url: result.fileUrl,
      source_image_url: imageUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-source-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

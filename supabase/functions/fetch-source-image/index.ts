import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL validation to prevent SSRF attacks
interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

function validateSourceUrl(url: unknown): ValidationResult {
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }
  
  if (url.length > 2048) {
    return { valid: false, error: 'URL too long (max 2048 chars)' };
  }
  
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, error: 'Only HTTP/HTTPS protocols allowed' };
  }
  
  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Block localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return { valid: false, error: 'Cannot fetch from localhost' };
  }
  
  // Block private IPv4 ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    
    // 10.0.0.0/8
    if (octets[0] === 10) {
      return { valid: false, error: 'Cannot fetch from private IP range' };
    }
    
    // 172.16.0.0/12
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
      return { valid: false, error: 'Cannot fetch from private IP range' };
    }
    
    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) {
      return { valid: false, error: 'Cannot fetch from private IP range' };
    }
    
    // 169.254.0.0/16 (link-local, includes cloud metadata endpoints)
    if (octets[0] === 169 && octets[1] === 254) {
      return { valid: false, error: 'Cannot fetch from link-local addresses' };
    }
    
    // 0.0.0.0/8
    if (octets[0] === 0) {
      return { valid: false, error: 'Cannot fetch from reserved IP range' };
    }
  }
  
  // Block private IPv6 ranges
  if (hostname.includes(':')) {
    // Unique local addresses (fc00::/7)
    if (hostname.startsWith('fc') || hostname.startsWith('fd')) {
      return { valid: false, error: 'Cannot fetch from private IPv6 range' };
    }
    // Link-local (fe80::/10)
    if (hostname.startsWith('fe80:')) {
      return { valid: false, error: 'Cannot fetch from link-local IPv6' };
    }
  }
  
  // Block common internal hostnames
  const blockedHostnames = [
    'metadata.google.internal',
    'metadata',
    'kubernetes.default',
    'kubernetes.default.svc',
  ];
  if (blockedHostnames.includes(hostname)) {
    return { valid: false, error: 'Cannot fetch from internal hostnames' };
  }
  
  return { valid: true, sanitized: parsedUrl.toString() };
}

// Validate image URL extracted from page
function validateImageUrl(imageUrl: string, baseUrl: string): ValidationResult {
  let absoluteUrl: string;
  
  try {
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      absoluteUrl = 'https:' + imageUrl;
    } else if (!imageUrl.startsWith('http')) {
      absoluteUrl = new URL(imageUrl, baseUrl).toString();
    } else {
      absoluteUrl = imageUrl;
    }
  } catch {
    return { valid: false, error: 'Invalid image URL format' };
  }
  
  // Validate the resolved URL
  return validateSourceUrl(absoluteUrl);
}

async function extractImageFromUrl(url: string): Promise<string | null> {
  console.log(`Fetching page: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkedInContentBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Failed to fetch page: ${response.status}`);
      return null;
    }

    // Limit response size to 5MB
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      console.error('Response too large');
      return null;
    }

    const html = await response.text();
    
    // Try to find Open Graph image
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      const validation = validateImageUrl(ogImageMatch[1], url);
      if (validation.valid) {
        console.log(`Found og:image: ${validation.sanitized}`);
        return validation.sanitized!;
      }
    }

    // Try Twitter card image
    const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                              html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    
    if (twitterImageMatch && twitterImageMatch[1]) {
      const validation = validateImageUrl(twitterImageMatch[1], url);
      if (validation.valid) {
        console.log(`Found twitter:image: ${validation.sanitized}`);
        return validation.sanitized!;
      }
    }

    // Try to find a prominent image (first large image in the page)
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+(?:\.png|\.jpg|\.jpeg|\.webp))["'][^>]*>/i);
    
    if (imgMatch && imgMatch[1]) {
      const validation = validateImageUrl(imgMatch[1], url);
      if (validation.valid) {
        console.log(`Found fallback image: ${validation.sanitized}`);
        return validation.sanitized!;
      }
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

    // Validate draft_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof draft_id !== 'string' || !uuidRegex.test(draft_id)) {
      return new Response(JSON.stringify({ error: 'Invalid draft_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate source URL to prevent SSRF attacks
    const urlValidation = validateSourceUrl(source_url);
    if (!urlValidation.valid) {
      console.log(`URL validation failed: ${urlValidation.error}`);
      return new Response(JSON.stringify({ error: urlValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validatedUrl = urlValidation.sanitized!;
    console.log(`Processing request: source_url=${validatedUrl}, draft_id=${draft_id}`);

    // Extract image URL from the source page
    const imageUrl = await extractImageFromUrl(validatedUrl);
    
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

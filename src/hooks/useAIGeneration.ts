import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GenerationType = 'hashtags' | 'rewrite' | 'image_description' | 'draft';

interface GenerateContentParams {
  type: GenerationType;
  inputs?: Record<string, any>;
  language?: string;
}

interface GenerateImageParams {
  prompt: string;
  draft_id?: string;
}

export function useAIGeneration() {
  const queryClient = useQueryClient();

  const generateContent = useMutation({
    mutationFn: async ({ type, inputs = {}, language }: GenerateContentParams) => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type, inputs, language },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.type === 'hashtags') {
        toast.success('Hashtags generated');
      } else if (variables.type === 'rewrite') {
        toast.success('Content rewritten');
      } else if (variables.type === 'image_description') {
        toast.success('Image description generated');
      } else if (variables.type === 'draft') {
        toast.success('Draft content generated');
      }
    },
    onError: (error: any) => {
      toast.error('AI generation failed: ' + (error.message || 'Unknown error'));
    },
  });

  const generateImage = useMutation({
    mutationFn: async ({ prompt, draft_id }: GenerateImageParams) => {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, draft_id },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Image generated successfully');
    },
    onError: (error: any) => {
      toast.error('Image generation failed: ' + (error.message || 'Unknown error'));
    },
  });

  const fetchSourceImage = useMutation({
    mutationFn: async ({ source_url, draft_id }: { source_url: string; draft_id: string }) => {
      const { data, error } = await supabase.functions.invoke('fetch-source-image', {
        body: { source_url, draft_id },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Image fetched from source');
    },
    onError: (error: any) => {
      toast.error('Failed to fetch image: ' + (error.message || 'Unknown error'));
    },
  });

  return {
    generateContent,
    generateImage,
    fetchSourceImage,
    isGenerating: generateContent.isPending || generateImage.isPending,
    isFetchingSourceImage: fetchSourceImage.isPending,
  };
}

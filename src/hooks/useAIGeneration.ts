import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GenerationType = 'topics' | 'draft' | 'hashtags' | 'rewrite';

interface GenerateContentParams {
  type: GenerationType;
  inputs?: Record<string, any>;
}

interface GenerateImageParams {
  prompt: string;
  draft_id?: string;
}

export function useAIGeneration() {
  const queryClient = useQueryClient();

  const generateContent = useMutation({
    mutationFn: async ({ type, inputs = {} }: GenerateContentParams) => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type, inputs },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.type === 'topics') {
        queryClient.invalidateQueries({ queryKey: ['topics'] });
        toast.success(`Generated ${data.topics?.length || 0} topics`);
      } else if (variables.type === 'draft') {
        toast.success('Draft content generated');
      } else if (variables.type === 'hashtags') {
        toast.success('Hashtags generated');
      } else if (variables.type === 'rewrite') {
        toast.success('Content rewritten');
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

  return {
    generateContent,
    generateImage,
    isGenerating: generateContent.isPending || generateImage.isPending,
  };
}

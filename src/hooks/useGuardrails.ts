import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Guardrails {
  id: string;
  banned_phrases: string[] | null;
  required_disclaimers: string[] | null;
  no_clickbait: boolean | null;
  allow_links: boolean | null;
  enforce_rules: boolean | null;
  max_hashtags: number | null;
  dedupe_threshold: number | null;
}

interface GuardrailsUpdate {
  banned_phrases?: string[];
  required_disclaimers?: string[];
  no_clickbait?: boolean;
  allow_links?: boolean;
  enforce_rules?: boolean;
  max_hashtags?: number;
  dedupe_threshold?: number;
}

interface AISuggestions {
  banned_phrases?: string[];
  disclaimers?: string[];
  rules?: string[];
}

export function useGuardrails() {
  const queryClient = useQueryClient();

  const { data: guardrails, isLoading } = useQuery({
    queryKey: ['guardrails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guardrails')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Guardrails | null;
    },
  });

  const updateGuardrails = useMutation({
    mutationFn: async (updates: GuardrailsUpdate) => {
      if (guardrails?.id) {
        const { data, error } = await supabase
          .from('guardrails')
          .update(updates)
          .eq('id', guardrails.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('guardrails')
          .insert(updates)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrails'] });
      toast.success('Guardrails saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save guardrails: ' + error.message);
    },
  });

  const suggestGuardrails = useMutation({
    mutationFn: async (context: string): Promise<AISuggestions> => {
      const { data, error } = await supabase.functions.invoke('suggest-guardrails', {
        body: { context },
      });
      
      if (error) throw error;
      return data as AISuggestions;
    },
    onError: (error) => {
      toast.error('Failed to get AI suggestions: ' + error.message);
    },
  });

  return {
    guardrails,
    isLoading,
    updateGuardrails,
    suggestGuardrails,
  };
}

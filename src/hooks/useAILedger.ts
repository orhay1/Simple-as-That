import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIOutputLedger } from '@/types/database';

export function useAILedger(entityId?: string) {
  const { data: ledgerEntries = [], isLoading, error } = useQuery({
    queryKey: ['ai-ledger', entityId],
    queryFn: async () => {
      let query = supabase
        .from('ai_output_ledger')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (entityId) {
        query = query.eq('created_entity_id', entityId);
      }
      
      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data as AIOutputLedger[];
    },
  });

  return {
    ledgerEntries,
    isLoading,
    error,
  };
}

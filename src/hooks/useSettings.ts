import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Settings } from '@/types/database';
import { toast } from 'sonner';

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      return data as Settings[];
    },
  });

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return null;
    try {
      return typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    } catch {
      return setting.value;
    }
  };

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from('settings')
        .update({ value: JSON.stringify(value) })
        .eq('key', key)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    },
  });

  return {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Settings } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  const upsertSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!user) throw new Error('User not authenticated');
      
      const existingSetting = settings.find(s => s.key === key);
      
      if (existingSetting) {
        const { data, error } = await supabase
          .from('settings')
          .update({ value: JSON.stringify(value) })
          .eq('key', key)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert({ key, value: JSON.stringify(value), user_id: user.id })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Setting saved');
    },
    onError: (error) => {
      toast.error('Failed to save setting: ' + error.message);
    },
  });

  return {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting,
    upsertSetting,
  };
}

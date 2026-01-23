import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function usePublications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: publications = [], isLoading, error } = useQuery({
    queryKey: ['publications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as Publication[];
    },
  });

  const createPublication = useMutation({
    mutationFn: async (publication: { post_draft_id?: string; final_content: Record<string, any>; published_url?: string; likes?: number; comments?: number; impressions?: number; notes?: string; is_manual_publish?: boolean }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('publications')
        .insert([{ ...publication, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Publication created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create publication: ' + error.message);
    },
  });

  const updatePublication = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Publication> & { id: string }) => {
      // Remove user_id from updates
      const { user_id, ...dbUpdates } = updates as any;
      const { data, error } = await supabase
        .from('publications')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      toast.success('Publication updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update publication: ' + error.message);
    },
  });

  const deletePublication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      toast.success('Publication deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete publication: ' + error.message);
    },
  });

  return {
    publications,
    isLoading,
    error,
    createPublication,
    updatePublication,
    deletePublication,
  };
}

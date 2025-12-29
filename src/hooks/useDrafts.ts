import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostDraft, PostStatus } from '@/types/database';
import { toast } from 'sonner';

export function useDrafts() {
  const queryClient = useQueryClient();

  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_drafts')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as PostDraft[];
    },
  });

  const createDraft = useMutation({
    mutationFn: async (draft: { title: string; body: string; topic_id?: string; hashtags_broad?: string[]; hashtags_niche?: string[]; hashtags_trending?: string[]; image_description?: string; status?: PostStatus }) => {
      const { data, error } = await supabase
        .from('post_drafts')
        .insert([draft])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Draft created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create draft: ' + error.message);
    },
  });

  const updateDraft = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PostDraft> & { id: string }) => {
      const { data, error } = await supabase
        .from('post_drafts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Draft updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update draft: ' + error.message);
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('post_drafts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Draft deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete draft: ' + error.message);
    },
  });

  const updateDraftStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PostStatus }) => {
      const { data, error } = await supabase
        .from('post_drafts')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
    onError: (error) => {
      toast.error('Failed to update draft status: ' + error.message);
    },
  });

  return {
    drafts,
    isLoading,
    error,
    createDraft,
    updateDraft,
    deleteDraft,
    updateDraftStatus,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostDraftWithAsset, PostStatus } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useDrafts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_drafts')
        .select(`
          *,
          image_asset:assets!image_asset_id (
            id,
            file_url,
            prompt
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as PostDraftWithAsset[];
    },
  });

  const createDraft = useMutation({
    mutationFn: async (draft: { title: string; body: string; topic_id?: string; news_item_id?: string; hashtags_broad?: string[]; hashtags_niche?: string[]; hashtags_trending?: string[]; image_description?: string; status?: PostStatus; source_url?: string; language?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('post_drafts')
        .insert([{ ...draft, user_id: user.id }])
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
    mutationFn: async ({ id, ...updates }: Partial<PostDraftWithAsset> & { id: string }) => {
      // Remove image_asset and user_id from updates as they shouldn't be updated
      const { image_asset, user_id: _, ...dbUpdates } = updates as PostDraftWithAsset;
      const { data, error } = await supabase
        .from('post_drafts')
        .update(dbUpdates)
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

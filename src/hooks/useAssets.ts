import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useAssets() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Asset[];
    },
  });

  const createAsset = useMutation({
    mutationFn: async (asset: { file_url: string; prompt?: string; is_ai_generated?: boolean; metadata?: Record<string, any> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('assets')
        .insert([{ ...asset, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create asset: ' + error.message);
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      // Step 1: Unlink this asset from any drafts that reference it
      await supabase
        .from('post_drafts')
        .update({ image_asset_id: null })
        .eq('image_asset_id', id);

      // Step 2: Get the asset to find the file path for storage cleanup
      const { data: asset } = await supabase
        .from('assets')
        .select('file_url')
        .eq('id', id)
        .single();

      // Step 3: Delete from appropriate storage bucket
      if (asset?.file_url?.includes('/ai-images/')) {
        const fileName = asset.file_url.split('/ai-images/').pop();
        if (fileName) {
          await supabase.storage.from('ai-images').remove([fileName]);
        }
      } else if (asset?.file_url?.includes('/user-uploads/')) {
        const fileName = asset.file_url.split('/user-uploads/').pop();
        if (fileName) {
          await supabase.storage.from('user-uploads').remove([fileName]);
        }
      }

      // Step 4: Delete the asset record
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Asset deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete asset: ' + error.message);
    },
  });

  const attachAssetToDraft = useMutation({
    mutationFn: async ({ draftId, assetId }: { draftId: string; assetId: string }) => {
      const { error } = await supabase
        .from('post_drafts')
        .update({ image_asset_id: assetId })
        .eq('id', draftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Image attached to draft');
    },
    onError: (error: Error) => {
      toast.error('Failed to attach image: ' + error.message);
    },
  });

  return {
    assets,
    isLoading,
    error,
    createAsset,
    deleteAsset,
    attachAssetToDraft,
  };
}

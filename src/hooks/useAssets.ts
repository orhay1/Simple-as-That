import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Asset } from '@/types/database';

export function useAssets() {
  const queryClient = useQueryClient();

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

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      // First get the asset to find the file path
      const { data: asset } = await supabase
        .from('assets')
        .select('file_url')
        .eq('id', id)
        .single();

      // If it's a storage URL, delete from storage too
      if (asset?.file_url?.includes('/ai-images/')) {
        const fileName = asset.file_url.split('/ai-images/').pop();
        if (fileName) {
          await supabase.storage.from('ai-images').remove([fileName]);
        }
      }

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
    deleteAsset,
    attachAssetToDraft,
  };
}

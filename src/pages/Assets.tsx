import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetCard } from '@/components/assets/AssetCard';
import { AssetDetailDialog } from '@/components/assets/AssetDetailDialog';
import { useAssets } from '@/hooks/useAssets';
import { Asset } from '@/types/database';
import { Search, ImageIcon, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type FilterType = 'all' | 'ai' | 'uploaded';

export default function Assets() {
  const { assets, isLoading, deleteAsset } = useAssets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = !search || asset.prompt?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'ai' ? asset.is_ai_generated :
      !asset.is_ai_generated;
    return matchesSearch && matchesFilter;
  }) || [];

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteAsset.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assets</h1>
            <p className="text-muted-foreground">Manage your images and media</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by prompt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ai">AI Generated</TabsTrigger>
              <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4" />
            <p className="text-lg">
              {search || filter !== 'all' ? 'No matching assets found' : 'No assets yet'}
            </p>
            <p className="text-sm">
              {!search && filter === 'all' && 'Generate images from the Drafts page to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onView={setSelectedAsset}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <AssetDetailDialog
        asset={selectedAsset}
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

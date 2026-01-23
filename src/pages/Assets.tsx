import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetCard } from '@/components/assets/AssetCard';
import { AssetDetailDialog } from '@/components/assets/AssetDetailDialog';
import { FileUploadButton } from '@/components/assets/FileUploadButton';
import { useAssets } from '@/hooks/useAssets';
import { useTranslation } from '@/hooks/useTranslation';
import { Asset } from '@/types/database';
import { Search, ImageIcon, Loader2, CheckSquare, X, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type FilterType = 'all' | 'ai' | 'uploaded';

export default function Assets() {
  const { assets, isLoading, deleteAsset } = useAssets();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = !search || asset.prompt?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'ai' ? asset.is_ai_generated :
      !asset.is_ai_generated;
    return matchesSearch && matchesFilter;
  }) || [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredAssets.map(a => a.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => {
      deleteAsset.mutate(id);
    });
    toast.success(`${t.common.delete} ${selectedIds.size}`);
    clearSelection();
  };

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
            <h1 className="text-3xl font-bold text-foreground">{t.assets.title}</h1>
            <p className="text-muted-foreground">{t.assets.subtitle}</p>
          </div>
          <FileUploadButton />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.common.search + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList dir="ltr">
              <TabsTrigger value="all">{t.common.all}</TabsTrigger>
              <TabsTrigger value="ai">{t.assets.aiGenerated}</TabsTrigger>
              <TabsTrigger value="uploaded">{t.assets.uploaded}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Batch Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedIds.size} {t.topics.selected}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="h-4 w-4 me-1" />
                {t.common.delete} ({selectedIds.size})
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearSelection}>
                <X className="h-3 w-3 me-1" />
                {t.topics.clear}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4" />
            <p className="text-lg">{t.assets.noAssets}</p>
          </div>
        ) : (
          <>
            {/* Select All Button */}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {t.topics.selectAll}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedIds.has(asset.id)}
                  onToggleSelect={() => toggleSelect(asset.id)}
                  onView={setSelectedAsset}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
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
            <AlertDialogTitle>{t.common.delete}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t.common.confirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

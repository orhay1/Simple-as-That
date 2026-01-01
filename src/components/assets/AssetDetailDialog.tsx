import { Asset } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, ExternalLink, Sparkles, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AssetDetailDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

export function AssetDetailDialog({ asset, open, onOpenChange, onDelete }: AssetDetailDialogProps) {
  if (!asset) return null;

  const validUrl = isValidUrl(asset.file_url);

  const handleCopyUrl = () => {
    if (!validUrl) {
      toast.error('Invalid image URL - please regenerate this image');
      return;
    }
    navigator.clipboard.writeText(asset.file_url!);
    toast.success('URL copied to clipboard');
  };

  const handleDownload = async () => {
    if (!validUrl) {
      toast.error('Cannot download - invalid image URL');
      return;
    }
    try {
      const response = await fetch(asset.file_url!);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-${asset.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download image');
    }
  };

  const handleDelete = () => {
    onDelete(asset.id);
    onOpenChange(false);
  };

  const metadata = asset.metadata as Record<string, unknown> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Asset Details
            {asset.is_ai_generated && (
              <Badge variant="secondary">
                <Sparkles className="mr-1 h-3 w-3" /> AI Generated
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {asset.file_url ? (
              <img
                src={asset.file_url}
                alt={asset.prompt || 'Asset'}
                className="w-full max-h-[400px] object-contain"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Prompt */}
          {asset.prompt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Prompt</label>
              <p className="text-sm text-foreground">{asset.prompt}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">Created</label>
              <p className="text-foreground">{format(new Date(asset.created_at), 'PPpp')}</p>
            </div>
            {metadata?.model && (
              <div>
                <label className="text-muted-foreground">Model</label>
                <p className="text-foreground">{String(metadata.model)}</p>
              </div>
            )}
            {metadata?.size && (
              <div>
                <label className="text-muted-foreground">Size</label>
                <p className="text-foreground">{String(metadata.size)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
              <Copy className="mr-2 h-4 w-4" /> Copy URL
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            {validUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(asset.file_url!, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDelete} className="ml-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

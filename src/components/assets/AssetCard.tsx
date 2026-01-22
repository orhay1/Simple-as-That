import { Asset } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Copy, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

interface AssetCardProps {
  asset: Asset;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onView: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export function AssetCard({ asset, isSelected, onToggleSelect, onView, onDelete }: AssetCardProps) {
  const validUrl = isValidUrl(asset.file_url);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!validUrl) {
      toast.error('Invalid image URL - please delete and regenerate');
      return;
    }
    navigator.clipboard.writeText(asset.file_url!);
    toast.success('URL copied to clipboard');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(asset.id);
  };

  return (
    <Card 
      className={`group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onView(asset)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square bg-muted">
          {/* Checkbox for selection */}
          {onToggleSelect && (
            <div 
              className="absolute top-2 left-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="bg-background/80"
              />
            </div>
          )}
          {asset.file_url ? (
            <img
              src={asset.file_url}
              alt={asset.prompt || 'Asset'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="secondary" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Copy className="mr-2 h-4 w-4" /> Copy URL
                </DropdownMenuItem>
                {asset.file_url && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.open(asset.file_url!, '_blank');
                  }}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Invalid URL Warning */}
          {!validUrl && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" /> Invalid
            </Badge>
          )}

          {/* AI Badge */}
          {asset.is_ai_generated && validUrl && (
            <Badge className="absolute bottom-2 left-2" variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" /> AI
            </Badge>
          )}
        </div>
        
        <div className="p-3 space-y-1">
          <p className="text-sm text-foreground line-clamp-2">
            {asset.prompt || 'No description'}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(asset.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

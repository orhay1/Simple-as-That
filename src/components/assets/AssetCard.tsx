import { Asset } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AssetCardProps {
  asset: Asset;
  onView: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export function AssetCard({ asset, onView, onDelete }: AssetCardProps) {
  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.file_url) {
      navigator.clipboard.writeText(asset.file_url);
      toast.success('URL copied to clipboard');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(asset.id);
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={() => onView(asset)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square bg-muted">
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

          {/* AI Badge */}
          {asset.is_ai_generated && (
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

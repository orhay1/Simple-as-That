import { ExternalLink, Sparkles, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { NewsItem } from '@/hooks/useNewsResearch';

interface NewsItemCardProps {
  item: NewsItem;
  onCreateTopic: (item: NewsItem) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NewsItemCard({ item, onCreateTopic, onDismiss, onDelete }: NewsItemCardProps) {
  const statusColors: Record<string, string> = {
    new: 'bg-primary/10 text-primary',
    used: 'bg-green-500/10 text-green-500',
    dismissed: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight line-clamp-2">
              {item.title}
            </CardTitle>
            {item.tool_name && (
              <Badge variant="outline" className="mt-1 text-xs">
                {item.tool_name}
              </Badge>
            )}
          </div>
          <Badge className={statusColors[item.status] || statusColors.new}>
            {item.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.summary}
          </p>
        )}
        
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1">
            {item.source_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => window.open(item.source_url!, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex gap-1">
            {item.status === 'new' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onDismiss(item.id)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Skip
              </Button>
            )}
            <Button
              size="sm"
              className="h-8"
              onClick={() => onCreateTopic(item)}
              disabled={item.status === 'used'}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Create Topic
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

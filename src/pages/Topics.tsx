import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDrafts } from '@/hooks/useDrafts';
import { useNewsResearch, type NewsItem } from '@/hooks/useNewsResearch';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Archive, FileEdit, Trash2, Loader2, Search, Newspaper, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchDialog } from '@/components/topics/ResearchDialog';

export default function Topics() {
  const { createDraft } = useDrafts();
  const { newsItems, researchNews, updateStatus, deleteNewsItem, isResearching, researchStatus } = useNewsResearch();
  const navigate = useNavigate();
  const [researchDialogOpen, setResearchDialogOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  const handleResearch = (query?: string) => {
    researchNews.mutate(query);
    setResearchDialogOpen(false);
  };

  const handleCreateDraftFromNews = (item: NewsItem) => {
    // Create draft directly from news item with structured content
    const draftBody = `${item.summary || ''}\n\n${item.full_content ? item.full_content.substring(0, 1000) : ''}\n\nSource: ${item.source_url || ''}`;
    
    createDraft.mutate({
      title: item.title,
      body: draftBody,
    });
    updateStatus.mutate({ id: item.id, status: 'used' });
    toast.success('Draft created from AI news');
    navigate('/drafts');
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const groupedNews = {
    new: newsItems.filter(n => n.status === 'new'),
    used: newsItems.filter(n => n.status === 'used'),
    dismissed: newsItems.filter(n => n.status === 'dismissed'),
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Tools Research</h1>
            <p className="text-muted-foreground">Discover and curate AI tools for LinkedIn posts</p>
          </div>
          <Button onClick={() => setResearchDialogOpen(true)} disabled={isResearching}>
            {isResearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {researchStatus || 'Researching...'}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Research AI Tools
              </>
            )}
          </Button>
        </div>

        {groupedNews.new.length === 0 && groupedNews.used.length === 0 && groupedNews.dismissed.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No AI tools discovered yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Research AI Tools" to discover the latest AI tools from GitHub, Taaft, and more
            </p>
            <Button onClick={() => setResearchDialogOpen(true)} disabled={isResearching}>
              {isResearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Start Research
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedNews.new.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  New ({groupedNews.new.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedNews.new.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onCreateDraft={() => handleCreateDraftFromNews(item)}
                      onViewDetails={() => setSelectedItem(item)}
                      onDelete={() => deleteNewsItem.mutate(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNews.used.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  <Star className="h-5 w-5" />
                  Used ({groupedNews.used.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedNews.used.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onCreateDraft={() => handleCreateDraftFromNews(item)}
                      onViewDetails={() => setSelectedItem(item)}
                      onDelete={() => deleteNewsItem.mutate(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNews.dismissed.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  <Archive className="h-5 w-5" />
                  Archived ({groupedNews.dismissed.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                  {groupedNews.dismissed.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onCreateDraft={() => handleCreateDraftFromNews(item)}
                      onViewDetails={() => setSelectedItem(item)}
                      onDelete={() => deleteNewsItem.mutate(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ResearchDialog
          open={researchDialogOpen}
          onOpenChange={setResearchDialogOpen}
          onResearch={handleResearch}
          isResearching={isResearching}
        />

        {/* Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem?.title}</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                {selectedItem.tool_name && (
                  <Badge variant="outline">{selectedItem.tool_name}</Badge>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Summary</h4>
                  <p className="text-muted-foreground">{selectedItem.summary}</p>
                </div>

                {selectedItem.full_content && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Full Content</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto bg-muted/50 p-4 rounded-lg">
                      {selectedItem.full_content}
                    </div>
                  </div>
                )}

                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  {selectedItem.source_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedItem.source_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Source
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      handleCreateDraftFromNews(selectedItem);
                      setSelectedItem(null);
                    }}
                    disabled={selectedItem.status === 'used'}
                  >
                    <FileEdit className="h-4 w-4 mr-1" />
                    Create Draft
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

interface NewsCardProps {
  item: NewsItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCreateDraft: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
}

function NewsCard({ item, isExpanded, onToggleExpand, onCreateDraft, onViewDetails, onDelete }: NewsCardProps) {
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
        <div className={isExpanded ? '' : 'line-clamp-3'}>
          <p className="text-sm text-muted-foreground">
            {item.summary}
          </p>
        </div>
        
        {item.summary && item.summary.length > 150 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show more
              </>
            )}
          </Button>
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
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onViewDetails}
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={onCreateDraft}
              disabled={item.status === 'used'}
            >
              <FileEdit className="h-3.5 w-3.5 mr-1" />
              To Draft
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

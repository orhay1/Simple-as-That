import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useDrafts } from '@/hooks/useDrafts';
import { useNewsResearch, type NewsItem } from '@/hooks/useNewsResearch';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Archive, FileEdit, Trash2, Loader2, Search, Newspaper, ExternalLink, ChevronDown, ChevronUp, CheckSquare, X, Copy, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchDialog } from '@/components/topics/ResearchDialog';
import { useTranslation } from '@/hooks/useTranslation';

export default function Topics() {
  const { t } = useTranslation();
  const { contentLanguage } = useLanguage();
  const { drafts, createDraft, updateDraft } = useDrafts();
  const { generateContent, isGenerating } = useAIGeneration();
  const { newsItems, researchNews, updateStatus, deleteNewsItem, isResearching, researchStatus } = useNewsResearch();
  const navigate = useNavigate();
  const [researchDialogOpen, setResearchDialogOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);

  const handleResearch = (query?: string, count?: number, language?: string) => {
    researchNews.mutate({ query, count, language });
    setResearchDialogOpen(false);
  };

  const handleCreateDraftFromNews = async (item: NewsItem) => {
    setGeneratingItemId(item.id);
    try {
      // Call AI to generate the post using Custom GPT instructions
      const result = await generateContent.mutateAsync({
        type: 'draft',
        inputs: {
          title: item.title,
          summary: item.summary,
          full_content: item.full_content,
          source_url: item.source_url,
        },
        language: contentLanguage,
      });

      // Create draft with AI-generated content and link to news item
      createDraft.mutate({
        title: item.title,
        body: result.draft?.body || item.summary || '',
        image_description: result.draft?.image_description,
        source_url: item.source_url || undefined,
        language: contentLanguage,
        news_item_id: item.id,
      });
      
      updateStatus.mutate({ id: item.id, status: 'used' });
      toast.success(t.drafts.status.draft + ' ' + t.common.success.toLowerCase());
      navigate('/drafts');
    } catch (error) {
      console.error('Failed to generate draft:', error);
      toast.error('Failed to generate draft. Please try again.');
    } finally {
      setGeneratingItemId(null);
    }
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

  const selectAll = (items: NewsItem[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      items.forEach(item => newSet.add(item.id));
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    
    selectedIds.forEach(id => {
      deleteNewsItem.mutate(id);
    });
    toast.success(`${t.common.delete} ${selectedIds.size}`);
    clearSelection();
  };

  const handleBatchToDraft = () => {
    if (selectedIds.size === 0) return;
    
    const itemsToConvert = newsItems.filter(item => selectedIds.has(item.id) && item.status !== 'used');
    
    itemsToConvert.forEach(item => {
      createDraft.mutate({
        title: item.title,
        body: item.summary || '',
        source_url: item.source_url || undefined,
        language: contentLanguage,
      });
      updateStatus.mutate({ id: item.id, status: 'used' });
    });
    
    toast.success(`${itemsToConvert.length} ${t.navigation.drafts.toLowerCase()}`);
    clearSelection();
    navigate('/drafts');
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
            <h1 className="text-3xl font-bold text-foreground">{t.topics.title}</h1>
            <p className="text-muted-foreground">{t.topics.subtitle}</p>
          </div>
          <Button onClick={() => setResearchDialogOpen(true)} disabled={isResearching}>
            {isResearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {researchStatus || t.research.searching}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {t.topics.researchAITools}
              </>
            )}
          </Button>
        </div>

        {groupedNews.new.length === 0 && groupedNews.used.length === 0 && groupedNews.dismissed.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">{t.topics.noToolsYet}</h3>
            <p className="text-muted-foreground mb-4">
              {t.topics.discoverDescription}
            </p>
            <Button onClick={() => setResearchDialogOpen(true)} disabled={isResearching}>
              {isResearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {t.topics.startResearch}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedIds.size} {t.topics.selected}</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearSelection}>
                    <X className="h-3 w-3 mr-1" />
                    {t.topics.clear}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBatchDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t.common.delete} ({selectedIds.size})
                  </Button>
                  <Button size="sm" onClick={handleBatchToDraft}>
                    <FileEdit className="h-4 w-4 mr-1" />
                    {t.topics.toDrafts} ({selectedIds.size})
                  </Button>
                </div>
              </div>
            )}

            {groupedNews.new.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {t.topics.new} ({groupedNews.new.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => selectAll(groupedNews.new)}>
                    {t.topics.selectAll}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedNews.new.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      isSelected={selectedIds.has(item.id)}
                      isGenerating={generatingItemId === item.id}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onCreateDraft={() => handleCreateDraftFromNews(item)}
                      onViewDetails={() => setSelectedItem(item)}
                      onDelete={() => deleteNewsItem.mutate(item.id)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNews.used.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                    <Star className="h-5 w-5" />
                    {t.topics.used} ({groupedNews.used.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => selectAll(groupedNews.used)}>
                    {t.topics.selectAll}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedNews.used.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      isSelected={selectedIds.has(item.id)}
                      isGenerating={generatingItemId === item.id}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onCreateDraft={() => handleCreateDraftFromNews(item)}
                      onViewDetails={() => setSelectedItem(item)}
                      onDelete={() => deleteNewsItem.mutate(item.id)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNews.dismissed.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                    <Archive className="h-5 w-5" />
                    {t.topics.archived} ({groupedNews.dismissed.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => selectAll(groupedNews.dismissed)}>
                    {t.topics.selectAll}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                  {groupedNews.dismissed.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      isSelected={selectedIds.has(item.id)}
                      isGenerating={generatingItemId === item.id}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onCreateDraft={() => handleCreateDraftFromNews(item)}
                      onViewDetails={() => setSelectedItem(item)}
                      onDelete={() => deleteNewsItem.mutate(item.id)}
                      t={t}
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
          contentLanguage={contentLanguage}
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
                  <h4 className="font-medium">{t.topics.summary}</h4>
                  <p className="text-muted-foreground">{selectedItem.summary}</p>
                </div>

                {selectedItem.full_content && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                        <h4 className="font-medium">Full Scraped Content</h4>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto bg-muted/50 p-4 rounded-lg mt-2">
                        {selectedItem.full_content}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Tags
                      </h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Copy className="h-3 w-3 mr-1" /> Copy Tags <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            const hashtags = selectedItem.tags!.map(tag => 
                              `#${tag.replace(/\s+/g, '').replace(/^\w/, c => c.toUpperCase())}`
                            ).join(' ');
                            navigator.clipboard.writeText(hashtags);
                            toast.success('Hashtags copied to clipboard');
                          }}>
                            <Copy className="h-4 w-4 mr-2" /> Copy All as Hashtags
                          </DropdownMenuItem>
                          {drafts.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Add to Draft</DropdownMenuLabel>
                              {drafts.slice(0, 5).map(draft => (
                                <DropdownMenuItem 
                                  key={draft.id}
                                  onClick={() => {
                                    const hashtags = selectedItem.tags!.map(tag => 
                                      tag.replace(/\s+/g, '').replace(/^\w/, c => c.toUpperCase())
                                    );
                                    updateDraft.mutate({
                                      id: draft.id,
                                      hashtags_niche: [
                                        ...(draft.hashtags_niche || []),
                                        ...hashtags.filter(h => !(draft.hashtags_niche || []).includes(h))
                                      ],
                                    });
                                    toast.success(`Tags added to "${draft.title}"`);
                                  }}
                                >
                                  <FileEdit className="h-4 w-4 mr-2" /> 
                                  <span className="truncate max-w-[200px]">{draft.title}</span>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  {selectedItem.official_url && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(selectedItem.official_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t.topics.visitTool}
                    </Button>
                  )}
                  {selectedItem.source_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedItem.source_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {selectedItem.official_url ? t.topics.viewSource : t.topics.visitTool}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={selectedItem.official_url || selectedItem.source_url ? 'outline' : 'default'}
                    onClick={() => {
                      handleCreateDraftFromNews(selectedItem);
                      setSelectedItem(null);
                    }}
                  >
                    <FileEdit className="h-4 w-4 mr-1" />
                    {t.topics.createDraft}
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
  isSelected: boolean;
  isGenerating?: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onCreateDraft: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function NewsCard({ item, isExpanded, isSelected, isGenerating, onToggleSelect, onToggleExpand, onCreateDraft, onViewDetails, onDelete, t }: NewsCardProps) {
  const statusColors: Record<string, string> = {
    new: 'bg-primary/10 text-primary',
    used: 'bg-green-500/10 text-green-500',
    dismissed: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    new: t.topics.new,
    used: t.topics.used,
    dismissed: t.topics.archived,
  };

  return (
    <Card className={`group relative transition-colors ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="mt-1"
          />
          <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
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
              {statusLabels[item.status] || item.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pl-10">
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
                {t.topics.showLess}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                {t.topics.showMore}
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
            {item.official_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => window.open(item.official_url!, '_blank')}
                title={t.topics.visitTool}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            {item.source_url && !item.official_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => window.open(item.source_url!, '_blank')}
                title={t.topics.viewSource}
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
              className="h-8 px-2 text-xs"
              onClick={onViewDetails}
            >
              {t.common.view}
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={onCreateDraft}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <FileEdit className="h-3 w-3 mr-1" />
              )}
              {isGenerating ? t.common.loading : t.topics.createDraft}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

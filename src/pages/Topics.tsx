import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTopics } from '@/hooks/useTopics';
import { useDrafts } from '@/hooks/useDrafts';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useNewsResearch, type NewsItem } from '@/hooks/useNewsResearch';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Star, Archive, FileEdit, Trash2, Loader2, Wand2, Search, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import { NewsItemCard } from '@/components/topics/NewsItemCard';
import { ResearchDialog } from '@/components/topics/ResearchDialog';

export default function Topics() {
  const { topics, createTopic, updateTopicStatus, deleteTopic } = useTopics();
  const { createDraft } = useDrafts();
  const { generateContent, isGenerating } = useAIGeneration();
  const { newsItems, researchNews, updateStatus, deleteNewsItem, isResearching } = useNewsResearch();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [newHook, setNewHook] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [researchDialogOpen, setResearchDialogOpen] = useState(false);

  const handleCreateTopic = () => {
    if (!newTitle.trim()) return toast.error('Title is required');
    createTopic.mutate({ title: newTitle, hook: newHook, rationale: newRationale });
    setNewTitle('');
    setNewHook('');
    setNewRationale('');
    setDialogOpen(false);
  };

  const handleGenerateTopics = () => {
    generateContent.mutate({
      type: 'topics',
      inputs: { context: aiContext || undefined },
    });
    setAiDialogOpen(false);
    setAiContext('');
  };

  const handleConvertToDraft = async (topic: typeof topics[0]) => {
    createDraft.mutate({
      title: topic.title,
      body: `${topic.hook || ''}\n\n${topic.rationale || ''}`,
      topic_id: topic.id,
    });
    updateTopicStatus.mutate({ id: topic.id, status: 'archived' });
    navigate('/drafts');
  };

  const handleResearch = (query?: string) => {
    researchNews.mutate(query);
    setResearchDialogOpen(false);
  };

  const handleCreateTopicFromNews = (item: NewsItem) => {
    createTopic.mutate({
      title: item.title,
      hook: item.summary || '',
      rationale: item.full_content?.substring(0, 500) || `Source: ${item.source_url}`,
      news_item_id: item.id,
    });
    updateStatus.mutate({ id: item.id, status: 'used' });
    toast.success('Topic created from news item');
  };

  const handleDismissNews = (id: string) => {
    updateStatus.mutate({ id, status: 'dismissed' });
  };

  const groupedTopics = {
    new: topics.filter(t => t.status === 'new'),
    shortlisted: topics.filter(t => t.status === 'shortlisted'),
    archived: topics.filter(t => t.status === 'archived'),
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
            <h1 className="text-3xl font-bold text-foreground">Topics</h1>
            <p className="text-muted-foreground">Generate and manage content ideas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setResearchDialogOpen(true)} disabled={isResearching}>
              {isResearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Research AI News
            </Button>
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate Topics with AI</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Optional: Describe your audience, industry, or content focus..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    AI will generate 5 topic ideas based on your context. Leave empty for general professional topics.
                  </p>
                  <Button onClick={handleGenerateTopics} className="w-full" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate 5 Topics
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Topic</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Topic</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Input placeholder="Topic Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                  <div><Input placeholder="Hook" value={newHook} onChange={(e) => setNewHook(e.target.value)} /></div>
                  <div><Textarea placeholder="Rationale" value={newRationale} onChange={(e) => setNewRationale(e.target.value)} /></div>
                  <Button onClick={handleCreateTopic} className="w-full">Create Topic</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="topics" className="w-full">
          <TabsList>
            <TabsTrigger value="topics">
              <Sparkles className="h-4 w-4 mr-2" />
              Topics ({topics.length})
            </TabsTrigger>
            <TabsTrigger value="research">
              <Newspaper className="h-4 w-4 mr-2" />
              AI News ({groupedNews.new.length} new)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="space-y-6 mt-6">
            {['new', 'shortlisted', 'archived'].map((status) => (
              <div key={status}>
                <h2 className="mb-4 text-lg font-semibold capitalize flex items-center gap-2">
                  {status === 'new' && <Sparkles className="h-5 w-5" />}
                  {status === 'shortlisted' && <Star className="h-5 w-5" />}
                  {status === 'archived' && <Archive className="h-5 w-5" />}
                  {status} ({groupedTopics[status as keyof typeof groupedTopics].length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedTopics[status as keyof typeof groupedTopics].map((topic) => (
                    <Card key={topic.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{topic.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{topic.hook}</p>
                        {topic.tags && topic.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-3">
                            {topic.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {status !== 'shortlisted' && status !== 'archived' && (
                            <Button size="sm" variant="outline" onClick={() => updateTopicStatus.mutate({ id: topic.id, status: 'shortlisted' })}>
                              <Star className="mr-1 h-3 w-3" /> Shortlist
                            </Button>
                          )}
                          {status !== 'archived' && (
                            <Button size="sm" variant="outline" onClick={() => handleConvertToDraft(topic)}>
                              <FileEdit className="mr-1 h-3 w-3" /> To Draft
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteTopic.mutate(topic.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {groupedTopics[status as keyof typeof groupedTopics].length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No {status} topics</p>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="research" className="space-y-6 mt-6">
            {groupedNews.new.length === 0 && groupedNews.used.length === 0 && groupedNews.dismissed.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No AI news yet</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Research AI News" to discover the latest AI tools and launches
                </p>
                <Button onClick={() => setResearchDialogOpen(true)} disabled={isResearching}>
                  {isResearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Start Research
                </Button>
              </div>
            ) : (
              <>
                {groupedNews.new.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      New ({groupedNews.new.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groupedNews.new.map((item) => (
                        <NewsItemCard
                          key={item.id}
                          item={item}
                          onCreateTopic={handleCreateTopicFromNews}
                          onDismiss={handleDismissNews}
                          onDelete={(id) => deleteNewsItem.mutate(id)}
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
                        <NewsItemCard
                          key={item.id}
                          item={item}
                          onCreateTopic={handleCreateTopicFromNews}
                          onDismiss={handleDismissNews}
                          onDelete={(id) => deleteNewsItem.mutate(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedNews.dismissed.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                      <Archive className="h-5 w-5" />
                      Dismissed ({groupedNews.dismissed.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                      {groupedNews.dismissed.map((item) => (
                        <NewsItemCard
                          key={item.id}
                          item={item}
                          onCreateTopic={handleCreateTopicFromNews}
                          onDismiss={handleDismissNews}
                          onDelete={(id) => deleteNewsItem.mutate(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <ResearchDialog
          open={researchDialogOpen}
          onOpenChange={setResearchDialogOpen}
          onResearch={handleResearch}
          isResearching={isResearching}
        />
      </div>
    </AppLayout>
  );
}

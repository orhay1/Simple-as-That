import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTopics } from '@/hooks/useTopics';
import { useDrafts } from '@/hooks/useDrafts';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Star, Archive, FileEdit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Topics() {
  const { topics, createTopic, updateTopicStatus, deleteTopic } = useTopics();
  const { createDraft } = useDrafts();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [newHook, setNewHook] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateTopic = () => {
    if (!newTitle.trim()) return toast.error('Title is required');
    createTopic.mutate({ title: newTitle, hook: newHook, rationale: newRationale });
    setNewTitle('');
    setNewHook('');
    setNewRationale('');
    setDialogOpen(false);
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

  const groupedTopics = {
    new: topics.filter(t => t.status === 'new'),
    shortlisted: topics.filter(t => t.status === 'shortlisted'),
    archived: topics.filter(t => t.status === 'archived'),
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
      </div>
    </AppLayout>
  );
}

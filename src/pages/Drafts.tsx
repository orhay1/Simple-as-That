import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDrafts } from '@/hooks/useDrafts';
import { Plus, Edit, Trash2, Eye, CheckCircle, Send } from 'lucide-react';
import { PostStatus } from '@/types/database';

export default function Drafts() {
  const { drafts, createDraft, updateDraft, updateDraftStatus, deleteDraft } = useDrafts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !body.trim()) return;
    createDraft.mutate({ title, body });
    setTitle('');
    setBody('');
    setDialogOpen(false);
  };

  const handleUpdate = () => {
    if (!editDraft) return;
    updateDraft.mutate({ id: editDraft.id, title, body });
    setEditDraft(null);
  };

  const openEdit = (draft: any) => {
    setEditDraft(draft);
    setTitle(draft.title);
    setBody(draft.body);
  };

  const statusColors: Record<PostStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    in_review: 'bg-chart-1/20 text-chart-1',
    approved: 'bg-chart-2/20 text-chart-2',
    scheduled: 'bg-chart-3/20 text-chart-3',
    published: 'bg-chart-4/20 text-chart-4',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Drafts</h1>
            <p className="text-muted-foreground">Create and edit your LinkedIn posts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Draft</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create New Draft</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Post Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Write your LinkedIn post here..." value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
                <Button onClick={handleCreate} className="w-full">Create Draft</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{draft.title}</CardTitle>
                  <Badge className={statusColors[draft.status]}>{draft.status.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-4">{draft.body}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openEdit(draft)}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  {draft.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => updateDraftStatus.mutate({ id: draft.id, status: 'in_review' })}>
                      <Eye className="mr-1 h-3 w-3" /> Submit Review
                    </Button>
                  )}
                  {draft.status === 'in_review' && (
                    <Button size="sm" variant="outline" onClick={() => updateDraftStatus.mutate({ id: draft.id, status: 'approved' })}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Approve
                    </Button>
                  )}
                  {draft.status === 'approved' && (
                    <Button size="sm" onClick={() => updateDraftStatus.mutate({ id: draft.id, status: 'published' })}>
                      <Send className="mr-1 h-3 w-3" /> Publish
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteDraft.mutate(draft.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {drafts.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No drafts yet. Create one!</CardContent></Card>
          )}
        </div>

        <Dialog open={!!editDraft} onOpenChange={() => setEditDraft(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Edit Draft</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
              <Button onClick={handleUpdate} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useDrafts } from '@/hooks/useDrafts';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useLinkedIn } from '@/hooks/useLinkedIn';
import { Plus, Edit, Trash2, Eye, CheckCircle, Send, Loader2, Wand2, Hash, Image, RotateCcw, ChevronDown, Link, Linkedin } from 'lucide-react';
import { PostStatus } from '@/types/database';
import { toast } from 'sonner';

export default function Drafts() {
  const { drafts, createDraft, updateDraft, updateDraftStatus, deleteDraft } = useDrafts();
  const { generateContent, generateImage, isGenerating } = useAIGeneration();
  const { isConnected, publishToLinkedIn } = useLinkedIn();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!title.trim() || !body.trim()) return;
    createDraft.mutate({ title, body, image_description: imageDescription || undefined });
    setTitle('');
    setBody('');
    setImageDescription('');
    setDialogOpen(false);
  };

  const handleUpdate = () => {
    if (!editDraft) return;
    updateDraft.mutate({ id: editDraft.id, title, body, image_description: imageDescription || undefined });
    setEditDraft(null);
  };

  const openEdit = (draft: any) => {
    setEditDraft(draft);
    setTitle(draft.title);
    setBody(draft.body);
    setImageDescription(draft.image_description || '');
  };

  const handleRewrite = (draftId: string, body: string, action: string) => {
    generateContent.mutate(
      { type: 'rewrite', inputs: { body, action } },
      {
        onSuccess: (data) => {
          if (data.rewritten) {
            updateDraft.mutate({ id: draftId, body: data.rewritten });
          }
        },
      }
    );
  };

  const handleGenerateHashtags = (draft: any) => {
    generateContent.mutate(
      { type: 'hashtags', inputs: { body: draft.body, title: draft.title } },
      {
        onSuccess: (data) => {
          if (data.hashtags) {
            updateDraft.mutate({
              id: draft.id,
              hashtags_broad: data.hashtags.hashtags_broad,
              hashtags_niche: data.hashtags.hashtags_niche,
              hashtags_trending: data.hashtags.hashtags_trending,
            });
          }
        },
      }
    );
  };

  const handleGenerateImageDescription = (draft: any) => {
    generateContent.mutate(
      { type: 'image_description', inputs: { title: draft.title, body: draft.body } },
      {
        onSuccess: (data) => {
          if (data.image_description) {
            updateDraft.mutate({ id: draft.id, image_description: data.image_description });
          }
        },
      }
    );
  };

  const handleGenerateImage = (draft: any) => {
    if (!draft.image_description) {
      toast.error('Add an image description first, or use "Generate Description"');
      return;
    }
    generateImage.mutate({ prompt: draft.image_description, draft_id: draft.id });
  };

  const handlePublishToLinkedIn = (draft: any) => {
    const hashtags = [
      ...(draft.hashtags_broad || []),
      ...(draft.hashtags_niche || []),
      ...(draft.hashtags_trending || []),
    ];
    
    publishToLinkedIn.mutate({
      content: draft.body,
      draftId: draft.id,
      hashtags,
    });
  };

  const handleManualPublish = (draftId: string) => {
    setPublishingDraftId(draftId);
    setPublishUrl('');
    setPublishDialogOpen(true);
  };

  const confirmManualPublish = () => {
    if (!publishingDraftId) return;
    updateDraft.mutate({ id: publishingDraftId, published_url: publishUrl || undefined });
    updateDraftStatus.mutate({ id: publishingDraftId, status: 'published' });
    setPublishDialogOpen(false);
    setPublishingDraftId(null);
    toast.success('Draft marked as published');
  };

  const statusColors: Record<PostStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    in_review: 'bg-chart-1/20 text-chart-1',
    approved: 'bg-chart-2/20 text-chart-2',
    scheduled: 'bg-chart-3/20 text-chart-3',
    published: 'bg-chart-4/20 text-chart-4',
  };

  const allHashtags = (draft: any) => [
    ...(draft.hashtags_broad || []),
    ...(draft.hashtags_niche || []),
    ...(draft.hashtags_trending || []),
  ];

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
                <Input placeholder="Image description (for AI generation)" value={imageDescription} onChange={(e) => setImageDescription(e.target.value)} />
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
                
                {allHashtags(draft).length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-4">
                    {allHashtags(draft).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                )}

                {draft.image_asset_id && (
                  <Badge variant="secondary" className="mb-4"><Image className="mr-1 h-3 w-3" /> Image attached</Badge>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openEdit(draft)}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                        AI <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Rewrite</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'tighten')}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Tighten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'expand')}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Expand
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'add_cta')}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Add CTA
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Tone</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'founder_tone')}>
                        Founder Voice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'educational_tone')}>
                        Educational
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'contrarian_tone')}>
                        Contrarian
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRewrite(draft.id, draft.body, 'story_tone')}>
                        Story Mode
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleGenerateHashtags(draft)}>
                        <Hash className="mr-2 h-4 w-4" /> Generate Hashtags
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Image</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleGenerateImageDescription(draft)}>
                        <Wand2 className="mr-2 h-4 w-4" /> Generate Description
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateImage(draft)}>
                        <Image className="mr-2 h-4 w-4" /> Generate Image
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={publishToLinkedIn.isPending}>
                          {publishToLinkedIn.isPending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="mr-1 h-3 w-3" />
                          )}
                          Publish <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {isConnected ? (
                          <DropdownMenuItem onClick={() => handlePublishToLinkedIn(draft)}>
                            <Linkedin className="mr-2 h-4 w-4" /> Publish to LinkedIn
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <Linkedin className="mr-2 h-4 w-4" /> LinkedIn not connected
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleManualPublish(draft.id)}>
                          <Link className="mr-2 h-4 w-4" /> Mark as Published
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              <Input placeholder="Image description" value={imageDescription} onChange={(e) => setImageDescription(e.target.value)} />
              <Button onClick={handleUpdate} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark as Published</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                After posting on LinkedIn, paste the URL here (optional) to track performance.
              </p>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="https://linkedin.com/posts/..." 
                  value={publishUrl} 
                  onChange={(e) => setPublishUrl(e.target.value)} 
                />
              </div>
              <Button onClick={confirmManualPublish} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Published
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

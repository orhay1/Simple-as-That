import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useDrafts } from '@/hooks/useDrafts';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useLinkedIn } from '@/hooks/useLinkedIn';
import { DraftEditorSheet } from '@/components/drafts/DraftEditorSheet';
import { Plus, Edit, Trash2, Eye, CheckCircle, Send, Loader2, ChevronDown, Link, Linkedin } from 'lucide-react';
import { PostStatus, PostDraftWithAsset } from '@/types/database';
import { toast } from 'sonner';

export default function Drafts() {
  const { drafts, createDraft, updateDraft, updateDraftStatus, deleteDraft } = useDrafts();
  const { generateContent, generateImage, isGenerating } = useAIGeneration();
  const { isConnected, publishToLinkedIn, connection } = useLinkedIn();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<PostDraftWithAsset | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleCreate = () => {
    if (!title.trim() || !body.trim()) return;
    createDraft.mutate({ title, body, image_description: imageDescription || undefined });
    setTitle('');
    setBody('');
    setImageDescription('');
    setDialogOpen(false);
  };

  const handleSave = (data: { title: string; body: string; image_description?: string }) => {
    if (!editDraft) return;
    updateDraft.mutate({ id: editDraft.id, ...data });
    setEditorOpen(false);
    setEditDraft(null);
  };

  const openEditor = (draft: PostDraftWithAsset) => {
    setEditDraft(draft);
    setEditorOpen(true);
  };

  const handleRewrite = (body: string, action: string) => {
    if (!editDraft) return;
    generateContent.mutate(
      { type: 'rewrite', inputs: { body, action } },
      {
        onSuccess: (data) => {
          if (data.rewritten) {
            updateDraft.mutate(
              { id: editDraft.id, body: data.rewritten },
              {
                onSuccess: () => {
                  // Update local state so the editor reflects the change
                  setEditDraft(prev => prev ? { ...prev, body: data.rewritten } : null);
                }
              }
            );
          }
        },
      }
    );
  };

  const handleGenerateHashtags = () => {
    if (!editDraft) return;
    generateContent.mutate(
      { type: 'hashtags', inputs: { body: editDraft.body, title: editDraft.title } },
      {
        onSuccess: (data) => {
          if (data.hashtags) {
            updateDraft.mutate(
              {
                id: editDraft.id,
                hashtags_broad: data.hashtags.hashtags_broad,
                hashtags_niche: data.hashtags.hashtags_niche,
                hashtags_trending: data.hashtags.hashtags_trending,
              },
              {
                onSuccess: () => {
                  // Update local state so hashtags show immediately
                  setEditDraft(prev => prev ? {
                    ...prev,
                    hashtags_broad: data.hashtags.hashtags_broad,
                    hashtags_niche: data.hashtags.hashtags_niche,
                    hashtags_trending: data.hashtags.hashtags_trending,
                  } : null);
                }
              }
            );
          }
        },
      }
    );
  };

  const handleGenerateImageDescription = () => {
    if (!editDraft) return;
    generateContent.mutate(
      { type: 'image_description', inputs: { title: editDraft.title, body: editDraft.body } },
      {
        onSuccess: (data) => {
          if (data.image_description) {
            updateDraft.mutate(
              { id: editDraft.id, image_description: data.image_description },
              {
                onSuccess: () => {
                  // Update local state so the description shows immediately
                  setEditDraft(prev => prev ? { ...prev, image_description: data.image_description } : null);
                }
              }
            );
          }
        },
      }
    );
  };

  const handleGenerateImage = () => {
    if (!editDraft?.image_description) {
      toast.error('Add an image description first, or use "Generate Description"');
      return;
    }
    setIsGeneratingImage(true);
    generateImage.mutate(
      { prompt: editDraft.image_description, draft_id: editDraft.id },
      {
        onSuccess: (data) => {
          // Update local state so the image shows immediately
          setEditDraft(prev => prev ? {
            ...prev,
            image_asset_id: data.asset_id,
            image_asset: { id: data.asset_id, file_url: data.image_url, prompt: editDraft.image_description }
          } : null);
          setIsGeneratingImage(false);
        },
        onError: () => {
          setIsGeneratingImage(false);
        }
      }
    );
  };

  const handleAttachAsset = (assetId: string) => {
    if (!editDraft) return;
    updateDraft.mutate(
      { id: editDraft.id, image_asset_id: assetId },
      {
        onSuccess: () => {
          // Refetch to get the joined asset data
          setEditDraft(prev => prev ? { ...prev, image_asset_id: assetId } : null);
          toast.success('Image attached to draft');
        }
      }
    );
  };

  const handlePublishToLinkedIn = (draft: PostDraftWithAsset) => {
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

  const allHashtags = (draft: PostDraftWithAsset) => [
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
              <DialogHeader>
                <DialogTitle>Create New Draft</DialogTitle>
                <DialogDescription>Write your LinkedIn post content below</DialogDescription>
              </DialogHeader>
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

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openEditor(draft)}>
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

        {/* Editor Sheet with LinkedIn Preview */}
        <DraftEditorSheet
          draft={editDraft}
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditDraft(null);
          }}
          onSave={handleSave}
          onRewrite={handleRewrite}
          onGenerateHashtags={handleGenerateHashtags}
          onGenerateImageDescription={handleGenerateImageDescription}
          onGenerateImage={handleGenerateImage}
          onAttachAsset={handleAttachAsset}
          isGenerating={isGenerating}
          isGeneratingImage={isGeneratingImage}
          profileName={connection?.profile_name || undefined}
          profileAvatar={connection?.avatar_url || undefined}
          profileHeadline={connection?.headline || undefined}
        />

        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Published</DialogTitle>
              <DialogDescription>Optionally add the LinkedIn post URL for tracking</DialogDescription>
            </DialogHeader>
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

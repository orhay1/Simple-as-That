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
import { useTranslation } from '@/hooks/useTranslation';
import { DraftEditorSheet } from '@/components/drafts/DraftEditorSheet';
import { Plus, Edit, Trash2, CheckCircle, Send, Loader2, ChevronDown, Link, Linkedin } from 'lucide-react';
import { PostStatus, PostDraftWithAsset } from '@/types/database';
import { toast } from 'sonner';

export default function Drafts() {
  const { drafts, createDraft, updateDraft, updateDraftStatus, deleteDraft } = useDrafts();
  const { generateContent, generateImage, fetchSourceImage, isGenerating, isFetchingSourceImage } = useAIGeneration();
  const { isConnected, publishToLinkedIn, connection } = useLinkedIn();
  const { t } = useTranslation();
  
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

  const handleSave = (data: { title: string; body: string; image_description?: string; language?: string }) => {
    if (!editDraft) return;
    updateDraft.mutate({ id: editDraft.id, ...data });
    setEditorOpen(false);
    setEditDraft(null);
  };

  const openEditor = (draft: PostDraftWithAsset) => {
    setEditDraft(draft);
    setEditorOpen(true);
  };

  const handleRewrite = (body: string, action: string, language?: string) => {
    if (!editDraft) return;
    generateContent.mutate(
      { type: 'rewrite', inputs: { body, action }, language },
      {
        onSuccess: (data) => {
          if (data.rewritten) {
            updateDraft.mutate(
              { id: editDraft.id, body: data.rewritten },
              {
                onSuccess: () => {
                  setEditDraft(prev => prev ? { ...prev, body: data.rewritten } : null);
                }
              }
            );
          }
        },
      }
    );
  };

  const handleGenerateHashtags = (title: string, body: string) => {
    if (!editDraft) return;
    generateContent.mutate(
      { type: 'hashtags', inputs: { body, title } },
      {
        onSuccess: (data) => {
          if (data.hashtags) {
            updateDraft.mutate({
              id: editDraft.id,
              hashtags_broad: data.hashtags.hashtags_broad,
              hashtags_niche: data.hashtags.hashtags_niche,
              hashtags_trending: data.hashtags.hashtags_trending,
            });
          }
        },
      }
    );
  };

  const handleGenerateImageDescription = (title: string, body: string) => {
    if (!editDraft) return;
    generateContent.mutate(
      { type: 'image_description', inputs: { title, body } },
      {
        onSuccess: (data) => {
          if (data.image_description) {
            updateDraft.mutate({ id: editDraft.id, image_description: data.image_description });
          }
        },
      }
    );
  };

  const handleGenerateImage = (imageDescription: string) => {
    if (!editDraft || !imageDescription) {
      toast.error('Add an image description first');
      return;
    }
    setIsGeneratingImage(true);
    generateImage.mutate(
      { prompt: imageDescription, draft_id: editDraft.id },
      {
        onSuccess: () => {
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
          setEditDraft(prev => prev ? { ...prev, image_asset_id: assetId } : null);
          toast.success(t.common.success);
        }
      }
    );
  };

  const handleFetchSourceImage = () => {
    if (!editDraft || !editDraft.source_url) {
      toast.error('No source URL available');
      return;
    }
    fetchSourceImage.mutate(
      { source_url: editDraft.source_url, draft_id: editDraft.id },
      {
        onSuccess: () => {
          setEditDraft(prev => prev ? { ...prev } : null);
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
    toast.success(t.common.success);
  };

  const statusColors: Record<PostStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
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
            <h1 className="text-3xl font-bold text-foreground">{t.drafts.title}</h1>
            <p className="text-muted-foreground">{t.drafts.subtitle}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="me-2 h-4 w-4" /> {t.drafts.newDraft}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t.drafts.newDraft}</DialogTitle>
                <DialogDescription>{t.drafts.subtitle}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder={t.drafts.editDraft} value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder={t.drafts.postContent} value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
                <Input placeholder={t.drafts.imageDescription} value={imageDescription} onChange={(e) => setImageDescription(e.target.value)} />
                <Button onClick={handleCreate} className="w-full">{t.common.create}</Button>
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
                  <Badge className={statusColors[draft.status as PostStatus] || statusColors.draft}>
                    {t.drafts.status[draft.status as keyof typeof t.drafts.status] || draft.status}
                  </Badge>
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
                    <Edit className="me-1 h-3 w-3" /> {t.common.edit}
                  </Button>

                  {draft.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => updateDraftStatus.mutate({ id: draft.id, status: 'approved' })}>
                      <CheckCircle className="me-1 h-3 w-3" /> {t.drafts.approve}
                    </Button>
                  )}
                  {draft.status === 'approved' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={publishToLinkedIn.isPending}>
                          {publishToLinkedIn.isPending ? (
                            <Loader2 className="me-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="me-1 h-3 w-3" />
                          )}
                          {t.drafts.publish} <ChevronDown className="ms-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {isConnected ? (
                          <DropdownMenuItem onClick={() => handlePublishToLinkedIn(draft)}>
                            <Linkedin className="me-2 h-4 w-4" /> Publish to LinkedIn
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <Linkedin className="me-2 h-4 w-4" /> LinkedIn not connected
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleManualPublish(draft.id)}>
                          <Link className="me-2 h-4 w-4" /> Mark as Published
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
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t.drafts.noDrafts}</CardContent></Card>
          )}
        </div>

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
          onFetchSourceImage={handleFetchSourceImage}
          onAttachAsset={handleAttachAsset}
          isGenerating={isGenerating}
          isGeneratingImage={isGeneratingImage}
          isFetchingSourceImage={isFetchingSourceImage}
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
                <CheckCircle className="me-2 h-4 w-4" /> {t.common.confirm}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

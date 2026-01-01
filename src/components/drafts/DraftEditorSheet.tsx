import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LinkedInPostPreview } from './LinkedInPostPreview';
import { PostDraft } from '@/types/database';
import { Wand2, Hash, Image, RotateCcw, ChevronDown, Loader2, X, Save } from 'lucide-react';

interface DraftEditorSheetProps {
  draft: PostDraft | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; body: string; image_description?: string }) => void;
  onRewrite: (body: string, action: string) => void;
  onGenerateHashtags: () => void;
  onGenerateImageDescription: () => void;
  onGenerateImage: () => void;
  isGenerating: boolean;
  profileName?: string;
  profileAvatar?: string;
  profileHeadline?: string;
}

export function DraftEditorSheet({
  draft,
  open,
  onOpenChange,
  onSave,
  onRewrite,
  onGenerateHashtags,
  onGenerateImageDescription,
  onGenerateImage,
  isGenerating,
  profileName,
  profileAvatar,
  profileHeadline,
}: DraftEditorSheetProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageDescription, setImageDescription] = useState('');

  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setBody(draft.body);
      setImageDescription(draft.image_description || '');
    }
  }, [draft]);

  const handleSave = () => {
    onSave({ title, body, image_description: imageDescription || undefined });
  };

  const allHashtags = [
    ...(draft?.hashtags_broad || []),
    ...(draft?.hashtags_niche || []),
    ...(draft?.hashtags_trending || []),
  ];

  // Get the image URL if there's an attached asset
  const imageUrl = draft?.image_asset_id ? undefined : undefined; // TODO: fetch actual image URL

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[900px] w-full p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle>Edit Draft</SheetTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={!title.trim() || !body.trim()}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Editor Panel */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-border space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Post title (internal reference)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Post Content</label>
              <Textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="Write your LinkedIn post here..."
                rows={12}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Image Description</label>
              <Input 
                value={imageDescription} 
                onChange={(e) => setImageDescription(e.target.value)} 
                placeholder="Describe the image for AI generation"
              />
            </div>

            {/* Hashtags Display */}
            {allHashtags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hashtags</label>
                <div className="flex flex-wrap gap-1">
                  {allHashtags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Actions */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-1 h-3 w-3" />}
                      Rewrite <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Style</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'tighten')}>Tighten</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'expand')}>Expand</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'add_cta')}>Add CTA</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Tone</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'founder_tone')}>Founder Voice</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'educational_tone')}>Educational</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'contrarian_tone')}>Contrarian</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'story_tone')}>Story Mode</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" variant="outline" onClick={onGenerateHashtags} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Hash className="mr-1 h-3 w-3" />}
                  Hashtags
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Image className="mr-1 h-3 w-3" />}
                      Image <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={onGenerateImageDescription}>
                      <Wand2 className="mr-2 h-4 w-4" /> Generate Description
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onGenerateImage} disabled={!imageDescription && !draft?.image_description}>
                      <Image className="mr-2 h-4 w-4" /> Generate Image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-[400px] p-6 overflow-y-auto bg-muted/30">
            <LinkedInPostPreview
              profileName={profileName}
              profileAvatar={profileAvatar}
              profileHeadline={profileHeadline}
              body={body}
              hashtags={allHashtags}
              imageUrl={imageUrl}
              imageDescription={imageDescription || draft?.image_description}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

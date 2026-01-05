import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LinkedInPostPreview } from './LinkedInPostPreview';
import { AssetPickerDialog } from './AssetPickerDialog';
import { PostDraftWithAsset } from '@/types/database';
import { Asset } from '@/types/database';
import { Wand2, Hash, Image, RotateCcw, ChevronDown, Loader2, Save, FolderOpen, Settings } from 'lucide-react';

interface DraftEditorSheetProps {
  draft: PostDraftWithAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; body: string; image_description?: string }) => void;
  onRewrite: (body: string, action: string) => void;
  onGenerateHashtags: (title: string, body: string) => void;
  onGenerateImageDescription: (title: string, body: string) => void;
  onGenerateImage: (imageDescription: string) => void;
  onAttachAsset: (assetId: string) => void;
  isGenerating: boolean;
  isGeneratingImage?: boolean;
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
  onAttachAsset,
  isGenerating,
  isGeneratingImage,
  profileName,
  profileAvatar,
  profileHeadline,
}: DraftEditorSheetProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleAssetSelect = (asset: Asset) => {
    onAttachAsset(asset.id);
  };

  // Only sync state when opening editor with a new draft (not on every draft change)
  useEffect(() => {
    if (open && draft) {
      setTitle(draft.title);
      setBody(draft.body);
      setImageDescription(draft.image_description || '');
    }
  }, [open, draft?.id]);

  const handleSave = () => {
    onSave({ title, body, image_description: imageDescription || undefined });
  };

  const allHashtags = [
    ...(draft?.hashtags_broad || []),
    ...(draft?.hashtags_niche || []),
    ...(draft?.hashtags_trending || []),
  ];

  // Get the image URL from the joined asset
  const imageUrl = draft?.image_asset?.file_url || undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[900px] w-full p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Edit Draft</SheetTitle>
              <SheetDescription>Edit your post and see a live LinkedIn preview</SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={!title.trim() || !body.trim()}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className={cn(
          "flex-1 overflow-hidden",
          isMobile ? "flex flex-col overflow-y-auto" : "flex"
        )}>
          {/* Editor Panel */}
          <div className={cn(
            "p-4 sm:p-6 space-y-4",
            isMobile ? "border-b border-border" : "flex-1 overflow-y-auto border-r border-border"
          )}>
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

                <Button size="sm" variant="outline" onClick={() => onGenerateHashtags(title, body)} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Hash className="mr-1 h-3 w-3" />}
                  Hashtags
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isGenerating || isGeneratingImage}>
                      {(isGenerating || isGeneratingImage) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Image className="mr-1 h-3 w-3" />}
                      Image <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onGenerateImageDescription(title, body)}>
                      <Wand2 className="mr-2 h-4 w-4" /> Generate Description
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateImage(imageDescription)} disabled={!imageDescription}>
                      <Image className="mr-2 h-4 w-4" /> Generate Image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowAssetPicker(true)}>
                      <FolderOpen className="mr-2 h-4 w-4" /> Choose from Library
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings?tab=images')}>
                      <Settings className="mr-2 h-4 w-4" /> Choose Model
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className={cn(
            "p-4 sm:p-6 bg-muted/30",
            isMobile ? "w-full" : "w-[400px] overflow-y-auto"
          )}>
            <LinkedInPostPreview
              profileName={profileName}
              profileAvatar={profileAvatar}
              profileHeadline={profileHeadline}
              body={body}
              hashtags={allHashtags}
              imageUrl={imageUrl}
              imageDescription={imageDescription || draft?.image_description || undefined}
              isGeneratingImage={isGeneratingImage}
            />
          </div>
        </div>

        {/* Asset Picker Dialog */}
        <AssetPickerDialog
          open={showAssetPicker}
          onOpenChange={setShowAssetPicker}
          onSelect={handleAssetSelect}
        />
      </SheetContent>
    </Sheet>
  );
}

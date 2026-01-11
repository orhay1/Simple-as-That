import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LinkedInPostPreview } from './LinkedInPostPreview';
import { AssetPickerDialog } from './AssetPickerDialog';
import { PostDraftWithAsset } from '@/types/database';
import { Asset } from '@/types/database';
import { Language } from '@/lib/i18n/translations';
import { Wand2, Hash, Image, RotateCcw, ChevronDown, Loader2, Save, FolderOpen, Settings, Globe, Languages, Search, Sparkles } from 'lucide-react';

interface DraftEditorSheetProps {
  draft: PostDraftWithAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; body: string; image_description?: string; language?: string }) => void;
  onRewrite: (body: string, action: string, language?: string) => void;
  onRetrieveHashtagsFromResearch: () => void;
  onGenerateHashtagsFree: (title: string, body: string) => void;
  onGenerateImageDescription: (title: string, body: string) => void;
  onGenerateImage: (imageDescription: string) => void;
  onFetchSourceImage?: () => void;
  onAttachAsset: (assetId: string) => void;
  isGenerating: boolean;
  isGeneratingImage?: boolean;
  isFetchingSourceImage?: boolean;
  hasLinkedResearch?: boolean;
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
  onRetrieveHashtagsFromResearch,
  onGenerateHashtagsFree,
  onGenerateImageDescription,
  onGenerateImage,
  onFetchSourceImage,
  onAttachAsset,
  isGenerating,
  isGeneratingImage,
  isFetchingSourceImage,
  hasLinkedResearch,
  profileName,
  profileAvatar,
  profileHeadline,
}: DraftEditorSheetProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [draftLanguage, setDraftLanguage] = useState<Language>('en');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { t, contentLanguage } = useLanguage();

  const handleAssetSelect = (asset: Asset) => {
    onAttachAsset(asset.id);
  };

  // Only sync state when opening editor with a new draft (not on every draft change)
  useEffect(() => {
    if (open && draft) {
      setTitle(draft.title);
      setBody(draft.body);
      setImageDescription(draft.image_description || '');
      setDraftLanguage((draft.language as Language) || contentLanguage);
    } else if (open && !draft) {
      setDraftLanguage(contentLanguage);
    }
  }, [open, draft?.id, contentLanguage]);

  const handleSave = () => {
    onSave({ title, body, image_description: imageDescription || undefined, language: draftLanguage });
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
              <label className="text-sm font-medium text-foreground">{t.drafts.title}</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Post title (internal reference)"
              />
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {t.drafts.language}
              </label>
              <Select value={draftLanguage} onValueChange={(v) => setDraftLanguage(v as Language)}>
                <SelectTrigger className="w-full max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t.settings.english}</SelectItem>
                  <SelectItem value="he">{t.settings.hebrew}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.drafts.postContent}</label>
              <Textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="Write your LinkedIn post here..."
                rows={12}
                className="resize-none"
                dir={draftLanguage === 'he' ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.drafts.imageDescription}</label>
              <Input 
                value={imageDescription} 
                onChange={(e) => setImageDescription(e.target.value)} 
                placeholder="Describe the image for AI generation"
              />
            </div>

            {/* Hashtags Display */}
            {allHashtags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.drafts.hashtags}</label>
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
                      {isGenerating ? <Loader2 className="me-1 h-3 w-3 animate-spin" /> : <RotateCcw className="me-1 h-3 w-3" />}
                      {t.drafts.rewrite} <ChevronDown className="ms-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Style</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'tighten', draftLanguage)}>{t.drafts.rewriteOptions.tighten}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'expand', draftLanguage)}>{t.drafts.rewriteOptions.expand}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'add_cta', draftLanguage)}>{t.drafts.rewriteOptions.addCta}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Tone</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'founder_tone', draftLanguage)}>{t.drafts.rewriteOptions.founderTone}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'educational_tone', draftLanguage)}>{t.drafts.rewriteOptions.educational}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'contrarian_tone', draftLanguage)}>{t.drafts.rewriteOptions.contrarian}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRewrite(body, 'story_tone', draftLanguage)}>{t.drafts.rewriteOptions.storyMode}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="me-1 h-3 w-3 animate-spin" /> : <Hash className="me-1 h-3 w-3" />}
                      {t.drafts.generateHashtags} <ChevronDown className="ms-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Source</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={onRetrieveHashtagsFromResearch}
                      disabled={!hasLinkedResearch}
                    >
                      <Search className="mr-2 h-4 w-4" /> Retrieve from Research
                      {!hasLinkedResearch && <span className="ml-2 text-xs text-muted-foreground">(No linked research)</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onGenerateHashtagsFree(title, body)}>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate with AI (Free)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isGenerating || isGeneratingImage || isFetchingSourceImage}>
                      {(isGenerating || isGeneratingImage || isFetchingSourceImage) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Image className="mr-1 h-3 w-3" />}
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
                    {draft?.source_url && onFetchSourceImage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onFetchSourceImage} disabled={isFetchingSourceImage}>
                          <Globe className="mr-2 h-4 w-4" /> 
                          {isFetchingSourceImage ? 'Fetching...' : 'Fetch from Source'}
                        </DropdownMenuItem>
                      </>
                    )}
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
              language={draftLanguage}
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

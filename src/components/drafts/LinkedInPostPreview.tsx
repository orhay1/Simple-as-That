import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageCircle, Repeat2, Send, Globe } from 'lucide-react';

interface LinkedInPostPreviewProps {
  profileName?: string;
  profileHeadline?: string;
  profileAvatar?: string;
  body: string;
  hashtags?: string[];
  imageUrl?: string;
  imageDescription?: string;
}

export function LinkedInPostPreview({
  profileName = 'Your Name',
  profileHeadline = 'Your headline',
  profileAvatar,
  body,
  hashtags = [],
  imageUrl,
  imageDescription,
}: LinkedInPostPreviewProps) {
  const characterCount = body.length;
  const maxCharacters = 3000;
  const isOverLimit = characterCount > maxCharacters;

  // Format hashtags as LinkedIn displays them
  const formattedHashtags = hashtags
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');

  const initials = profileName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">LinkedIn Preview</span>
        <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
          {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}
        </span>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {/* Post Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profileAvatar} alt={profileName} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{profileName}</p>
              <p className="text-xs text-muted-foreground truncate">{profileHeadline}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">Just now</span>
                <span className="text-xs text-muted-foreground">·</span>
                <Globe className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {body || <span className="text-muted-foreground italic">Your post content will appear here...</span>}
          </div>
          
          {formattedHashtags && (
            <p className="mt-2 text-sm text-primary">{formattedHashtags}</p>
          )}
        </div>

        {/* Image Preview */}
        {(imageUrl || imageDescription) && (
          <div className="border-t border-border">
            {imageUrl ? (
              <img src={imageUrl} alt="Post image" className="w-full object-cover max-h-80" />
            ) : (
              <div className="bg-muted/50 h-48 flex items-center justify-center">
                <div className="text-center px-4">
                  <p className="text-sm text-muted-foreground">Image will be generated from:</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{imageDescription}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="flex -space-x-1">
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <ThumbsUp className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
            </div>
            <span className="ml-1">Be the first to react</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-2 py-1 border-t border-border flex items-center justify-around">
          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-muted/50 text-muted-foreground">
            <ThumbsUp className="h-5 w-5" />
            <span className="text-xs font-medium">Like</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-muted/50 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Comment</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-muted/50 text-muted-foreground">
            <Repeat2 className="h-5 w-5" />
            <span className="text-xs font-medium">Repost</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-muted/50 text-muted-foreground">
            <Send className="h-5 w-5" />
            <span className="text-xs font-medium">Send</span>
          </button>
        </div>
      </div>

      {/* Hashtag Categories */}
      {hashtags.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {hashtags.length} hashtag{hashtags.length !== 1 ? 's' : ''} attached
        </div>
      )}
    </div>
  );
}

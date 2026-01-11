import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LinkedInPostPreview } from '@/components/drafts/LinkedInPostPreview';
import { Publication } from '@/types/database';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface PublicationPreviewDialogProps {
  publication: Publication | null;
  profileName?: string;
  profileHeadline?: string;
  profileAvatar?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublicationPreviewDialog({
  publication,
  profileName,
  profileHeadline,
  profileAvatar,
  open,
  onOpenChange,
}: PublicationPreviewDialogProps) {
  const { t } = useTranslation();

  if (!publication) return null;

  const content = publication.final_content || {};
  const body = content.body || '';
  const hashtags = content.hashtags || [];
  const imageUrl = content.image_url || null;
  const imageDescription = content.image_description || null;
  const language = content.language || 'en';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t.published.viewPreview || 'View Preview'}
            {publication.is_manual_publish && (
              <Badge variant="outline" className="text-xs">
                {t.published.manualPublish || 'Manual'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span>
              {t.published.publishedOn || 'Published on'}: {format(new Date(publication.published_at), 'PPP')}
            </span>
            {publication.published_url && (
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href={publication.published_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 me-1" />
                  {t.published.linkedInPost || 'View on LinkedIn'}
                </a>
              </Button>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <LinkedInPostPreview
            profileName={profileName || 'LinkedIn User'}
            profileHeadline={profileHeadline}
            profileAvatar={profileAvatar}
            body={body}
            hashtags={hashtags}
            imageUrl={imageUrl}
            imageDescription={imageDescription}
            language={language as 'en' | 'he'}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

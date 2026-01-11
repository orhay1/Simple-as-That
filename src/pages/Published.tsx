import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePublications } from '@/hooks/usePublications';
import { useLinkedIn } from '@/hooks/useLinkedIn';
import { useTranslation } from '@/hooks/useTranslation';
import { PublicationPreviewDialog } from '@/components/publications/PublicationPreviewDialog';
import { Publication } from '@/types/database';
import { Heart, MessageCircle, Eye, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function Published() {
  const { publications } = usePublications();
  const { connection } = useLinkedIn();
  const { t } = useTranslation();
  
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const totalLikes = publications.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = publications.reduce((sum, p) => sum + (p.comments || 0), 0);
  const totalImpressions = publications.reduce((sum, p) => sum + (p.impressions || 0), 0);

  const handleViewPreview = (publication: Publication) => {
    setSelectedPublication(publication);
    setPreviewOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.published.title}</h1>
          <p className="text-muted-foreground">{t.published.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.published.likes}</CardTitle>
              <Heart className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalLikes}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.published.comments}</CardTitle>
              <MessageCircle className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalComments}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.published.impressions}</CardTitle>
              <Eye className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalImpressions}</div></CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {publications.length > 0 ? (
            publications.map((publication) => {
              const content = publication.final_content || {};
              const hasImage = !!content.image_url;
              
              return (
                <Card key={publication.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{content.title || 'Untitled Post'}</h3>
                          {publication.is_manual_publish && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {t.published.manualPublish}
                            </Badge>
                          )}
                          {hasImage && (
                            <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {content.body || ''}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{t.published.publishedOn}: {format(new Date(publication.published_at), 'PP')}</span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {publication.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {publication.comments || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {publication.impressions || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewPreview(publication)}
                        >
                          {t.published.viewPreview}
                        </Button>
                        {publication.published_url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={publication.published_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t.published.noPublished}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PublicationPreviewDialog
        publication={selectedPublication}
        profileName={connection?.profile_name || undefined}
        profileHeadline={connection?.headline || undefined}
        profileAvatar={connection?.avatar_url || undefined}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </AppLayout>
  );
}

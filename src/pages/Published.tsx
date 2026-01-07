import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublications } from '@/hooks/usePublications';
import { useDrafts } from '@/hooks/useDrafts';
import { useTranslation } from '@/hooks/useTranslation';
import { BarChart3, Heart, MessageCircle, Eye } from 'lucide-react';

export default function Published() {
  const { publications } = usePublications();
  const { drafts } = useDrafts();
  const { t } = useTranslation();
  const publishedDrafts = drafts.filter(d => d.status === 'published');

  const totalLikes = publications.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = publications.reduce((sum, p) => sum + (p.comments || 0), 0);
  const totalImpressions = publications.reduce((sum, p) => sum + (p.impressions || 0), 0);

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

        <Card>
          <CardHeader><CardTitle>{t.published.title}</CardTitle></CardHeader>
          <CardContent>
            {publishedDrafts.length > 0 ? (
              <div className="space-y-4">
                {publishedDrafts.map((draft) => (
                  <div key={draft.id} className="border-b border-border pb-4 last:border-0">
                    <h3 className="font-medium">{draft.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{draft.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t.published.noPublished}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

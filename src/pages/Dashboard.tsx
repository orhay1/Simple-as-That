import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNewsResearch } from '@/hooks/useNewsResearch';
import { useDrafts } from '@/hooks/useDrafts';
import { usePublications } from '@/hooks/usePublications';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileEdit, CheckCircle, Send, ArrowRight } from 'lucide-react';
import { getContentDirection } from '@/lib/utils';

export default function Dashboard() {
  const { newsItems } = useNewsResearch();
  const { drafts } = useDrafts();
  const { publications } = usePublications();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const aiToolsCount = newsItems.length;
  const draftCount = drafts.filter(d => d.status === 'draft').length;
  const approvedCount = drafts.filter(d => d.status === 'approved').length;
  const publishedCount = publications.length;

  const stats = [
    { title: t.dashboard.aiToolsResearched, value: aiToolsCount, icon: Sparkles, color: 'text-chart-1' },
    { title: t.dashboard.draftsCount, value: draftCount, icon: FileEdit, color: 'text-chart-2' },
    { title: t.dashboard.approved, value: approvedCount, icon: CheckCircle, color: 'text-chart-3' },
    { title: t.dashboard.publishedCount, value: publishedCount, icon: Send, color: 'text-chart-4' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.dashboard.recentAITools}
                <Button size="sm" variant="outline" onClick={() => navigate('/topics')}>
                  <Sparkles className="me-1 h-4 w-4" /> {t.dashboard.research}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {newsItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                  <div className="flex-1" dir={getContentDirection(item.summary || '')}>
                    <p className="font-medium text-foreground">{item.tool_name || item.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.summary}</p>
                  </div>
                  <Badge variant={item.status === 'used' ? 'default' : 'secondary'}>
                    {item.status === 'used' ? t.topics.used : t.topics.new}
                  </Badge>
                </div>
              ))}
              {newsItems.length === 0 && <p className="text-center text-muted-foreground py-8">{t.dashboard.noAITools}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.dashboard.recentDrafts}
                <Button size="sm" variant="outline" onClick={() => navigate('/drafts')}>
                  {t.dashboard.viewAll} <ArrowRight className="ms-1 h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {drafts.slice(0, 5).map((draft) => (
                <div key={draft.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                  <div className="flex-1" dir={getContentDirection(draft.body || '')}>
                    <p className="font-medium text-foreground">{draft.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{draft.body.substring(0, 60)}...</p>
                  </div>
                  <Badge variant={draft.status === 'approved' ? 'default' : 'secondary'}>
                    {t.drafts.status[draft.status as keyof typeof t.drafts.status] || draft.status}
                  </Badge>
                </div>
              ))}
              {drafts.length === 0 && <p className="text-center text-muted-foreground py-8">{t.dashboard.noDrafts}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

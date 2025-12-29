import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTopics } from '@/hooks/useTopics';
import { useDrafts } from '@/hooks/useDrafts';
import { usePublications } from '@/hooks/usePublications';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, FileEdit, BarChart3, Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { topics } = useTopics();
  const { drafts } = useDrafts();
  const { publications } = usePublications();
  const navigate = useNavigate();

  const newTopics = topics.filter(t => t.status === 'new').length;
  const shortlistedTopics = topics.filter(t => t.status === 'shortlisted').length;
  const draftCount = drafts.filter(d => d.status === 'draft').length;
  const readyCount = drafts.filter(d => d.status === 'approved').length;

  const stats = [
    { title: 'New Topics', value: newTopics, icon: Lightbulb, color: 'text-chart-1' },
    { title: 'Shortlisted', value: shortlistedTopics, icon: Lightbulb, color: 'text-chart-2' },
    { title: 'Drafts', value: draftCount, icon: FileEdit, color: 'text-chart-3' },
    { title: 'Ready to Publish', value: readyCount, icon: BarChart3, color: 'text-chart-4' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your LinkedIn content pipeline</p>
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
                Recent Topics
                <Button size="sm" variant="outline" onClick={() => navigate('/topics')}>
                  <Plus className="mr-1 h-4 w-4" /> Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topics.slice(0, 5).map((topic) => (
                <div key={topic.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{topic.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{topic.hook}</p>
                  </div>
                  <Badge variant={topic.status === 'shortlisted' ? 'default' : 'secondary'}>{topic.status}</Badge>
                </div>
              ))}
              {topics.length === 0 && <p className="text-center text-muted-foreground py-8">No topics yet. Generate some!</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Drafts
                <Button size="sm" variant="outline" onClick={() => navigate('/drafts')}>
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {drafts.slice(0, 5).map((draft) => (
                <div key={draft.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{draft.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{draft.body.substring(0, 60)}...</p>
                  </div>
                  <Badge variant={draft.status === 'approved' ? 'default' : 'secondary'}>{draft.status}</Badge>
                </div>
              ))}
              {drafts.length === 0 && <p className="text-center text-muted-foreground py-8">No drafts yet. Create one from a topic!</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

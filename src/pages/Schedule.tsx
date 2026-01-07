import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Calendar } from 'lucide-react';

export default function Schedule() {
  const { t } = useTranslation();
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.schedule.title}</h1>
          <p className="text-muted-foreground">{t.schedule.subtitle}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.schedule.noScheduled}</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from 'lucide-react';

export default function Assets() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold text-foreground">Assets</h1><p className="text-muted-foreground">Manage your images and media</p></div>
        <Card><CardContent className="py-12 text-center"><Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Asset library coming soon</p></CardContent></Card>
      </div>
    </AppLayout>
  );
}

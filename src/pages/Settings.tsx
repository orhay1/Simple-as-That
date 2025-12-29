import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Settings as SettingsIcon, Linkedin, FileText, Shield } from 'lucide-react';

export default function Settings() {
  const { settings, getSetting } = useSettings();
  const { isManager } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold text-foreground">Settings</h1><p className="text-muted-foreground">Configure your content studio</p></div>
        
        <Tabs defaultValue="prompts">
          <TabsList>
            <TabsTrigger value="prompts"><FileText className="mr-2 h-4 w-4" />Prompts</TabsTrigger>
            <TabsTrigger value="linkedin"><Linkedin className="mr-2 h-4 w-4" />LinkedIn</TabsTrigger>
            <TabsTrigger value="guardrails"><Shield className="mr-2 h-4 w-4" />Guardrails</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>AI Generation Prompts</CardTitle><CardDescription>Customize prompts for content generation</CardDescription></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Topic Generator, Draft Generator, and Hashtag Generator prompts are pre-configured from your n8n workflow. {isManager ? 'You can edit them here.' : 'Contact a manager to edit.'}</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="linkedin">
            <Card>
              <CardHeader><CardTitle>LinkedIn Connection</CardTitle><CardDescription>Connect your LinkedIn profile for direct publishing</CardDescription></CardHeader>
              <CardContent><p className="text-muted-foreground">LinkedIn OAuth integration coming soon. You can manually publish and track URLs.</p></CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guardrails">
            <Card>
              <CardHeader><CardTitle>Content Guardrails</CardTitle><CardDescription>Set rules for content quality</CardDescription></CardHeader>
              <CardContent><p className="text-muted-foreground">Banned phrases, disclaimers, and content rules are pre-configured. Manager can edit.</p></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

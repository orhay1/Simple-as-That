import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLinkedIn } from '@/hooks/useLinkedIn';
import { useLanguage } from '@/contexts/LanguageContext';
import { PromptsTab } from '@/components/settings/PromptsTab';
import { ImageSettingsTab } from '@/components/settings/ImageSettingsTab';
import { GuardrailsTab } from '@/components/settings/GuardrailsTab';
import { LanguageTab } from '@/components/settings/LanguageTab';
import { AccountTab } from '@/components/settings/AccountTab';
import { APIKeysTab } from '@/components/settings/APIKeysTab';
import { Linkedin, FileText, Shield, CheckCircle, AlertCircle, Loader2, LogOut, Image, Globe, User, Key } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Settings() {
  const { connection, isLoading, isConnected, isExpired, connectLinkedIn, disconnectLinkedIn } = useLinkedIn();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const linkedinStatus = searchParams.get('linkedin');
    if (linkedinStatus === 'connected') {
      toast.success('LinkedIn connected successfully!');
      setSearchParams({});
    } else if (linkedinStatus === 'error') {
      const message = searchParams.get('message') || 'Connection failed';
      toast.error(message);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Get the tab from URL or default to apikeys
  const tabFromUrl = searchParams.get('tab') || 'apikeys';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.settings.title}</h1>
          <p className="text-muted-foreground">{t.settings.subtitle}</p>
        </div>
        
        <Tabs value={tabFromUrl} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid" dir="ltr">
            <TabsTrigger value="apikeys" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settingsApiKeys.title}</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings.linkedin}</span>
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings.prompts}</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings.images}</span>
            </TabsTrigger>
            <TabsTrigger value="guardrails" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings.guardrails}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings.language}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings.account}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="apikeys">
            <APIKeysTab />
          </TabsContent>
          
          <TabsContent value="linkedin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5" />
                  {t.settings.linkedinConnection}
                </CardTitle>
                <CardDescription>{t.settings.linkedinDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.settings.checkingConnection}
                  </div>
                ) : isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Linkedin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{connection?.profile_name || 'LinkedIn Profile'}</span>
                          {isExpired ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="me-1 h-3 w-3" /> {t.settings.expired}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="me-1 h-3 w-3" /> {t.settings.connected}
                            </Badge>
                          )}
                        </div>
                        {connection?.connected_at && (
                          <p className="text-sm text-muted-foreground">
                            {t.settings.connectedOn} {format(new Date(connection.connected_at), 'MMM d, yyyy')}
                          </p>
                        )}
                        {connection?.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            {t.settings.tokenExpires}: {format(new Date(connection.expires_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {isExpired && (
                        <Button onClick={connectLinkedIn} size="sm">
                          <Linkedin className="me-2 h-4 w-4" /> {t.settings.reconnect}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => disconnectLinkedIn.mutate()}
                        disabled={disconnectLinkedIn.isPending}
                      >
                        {disconnectLinkedIn.isPending ? (
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="me-2 h-4 w-4" />
                        )}
                        {t.settings.disconnect}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      {t.settings.connectDescription}
                    </p>
                    <Button onClick={connectLinkedIn}>
                      <Linkedin className="me-2 h-4 w-4" /> {t.settings.connect}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prompts">
            <PromptsTab />
          </TabsContent>

          <TabsContent value="images">
            <ImageSettingsTab />
          </TabsContent>
          
          <TabsContent value="guardrails">
            <GuardrailsTab />
          </TabsContent>

          <TabsContent value="language">
            <LanguageTab />
          </TabsContent>

          <TabsContent value="account">
            <AccountTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

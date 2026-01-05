import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLinkedIn } from '@/hooks/useLinkedIn';
import { PromptsTab } from '@/components/settings/PromptsTab';
import { VoiceStyleTab } from '@/components/settings/VoiceStyleTab';
import { ImageSettingsTab } from '@/components/settings/ImageSettingsTab';
import { GuardrailsTab } from '@/components/settings/GuardrailsTab';
import { Linkedin, FileText, Shield, CheckCircle, AlertCircle, Loader2, LogOut, Type, Image } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Settings() {
  const { connection, isLoading, isConnected, isExpired, connectLinkedIn, disconnectLinkedIn } = useLinkedIn();
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

  // Get the tab from URL or default to linkedin
  const tabFromUrl = searchParams.get('tab') || 'linkedin';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your content studio</p>
        </div>
        
        <Tabs value={tabFromUrl} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Prompts</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Tone</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Images</span>
            </TabsTrigger>
            <TabsTrigger value="guardrails" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Guardrails</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="linkedin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5" />
                  LinkedIn Connection
                </CardTitle>
                <CardDescription>Connect your LinkedIn profile for direct publishing</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking connection...
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
                              <AlertCircle className="mr-1 h-3 w-3" /> Expired
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" /> Connected
                            </Badge>
                          )}
                        </div>
                        {connection?.connected_at && (
                          <p className="text-sm text-muted-foreground">
                            Connected {format(new Date(connection.connected_at), 'MMM d, yyyy')}
                          </p>
                        )}
                        {connection?.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Token expires: {format(new Date(connection.expires_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {isExpired && (
                        <Button onClick={connectLinkedIn} size="sm">
                          <Linkedin className="mr-2 h-4 w-4" /> Reconnect
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => disconnectLinkedIn.mutate()}
                        disabled={disconnectLinkedIn.isPending}
                      >
                        {disconnectLinkedIn.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Connect your LinkedIn account to publish posts directly from this platform.
                    </p>
                    <Button onClick={connectLinkedIn}>
                      <Linkedin className="mr-2 h-4 w-4" /> Connect LinkedIn
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prompts">
            <PromptsTab />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceStyleTab />
          </TabsContent>

          <TabsContent value="images">
            <ImageSettingsTab />
          </TabsContent>
          
          <TabsContent value="guardrails">
            <GuardrailsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

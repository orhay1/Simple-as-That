import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ExternalLink, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface APIKeyConfig {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  getKeyUrl: string;
  getKeyLabel: string;
  isRequired: boolean;
  usedFor: string[];
}

const API_KEY_CONFIGS: Record<string, APIKeyConfig> = {
  user_api_key_gemini: {
    key: 'user_api_key_gemini',
    label: 'Gemini API Key',
    description: 'Powers all AI features: draft generation, hashtags, rewrites, image generation, and research fallback. Get your FREE key from Google AI Studio.',
    placeholder: 'AIza...',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    getKeyLabel: 'Get Free Key at Google AI Studio',
    isRequired: true,
    usedFor: ['Drafts', 'Hashtags', 'Rewrites', 'Images', 'Research Fallback'],
  },
  user_api_key_openai: {
    key: 'user_api_key_openai',
    label: 'ChatGPT / OpenAI API Key',
    description: 'Alternative for text generation (drafts, hashtags, rewrites). Equal priority with Gemini - use whichever you prefer. Also enables DALL-E for images.',
    placeholder: 'sk-...',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    getKeyLabel: 'Get Key at OpenAI Platform',
    isRequired: false,
    usedFor: ['Drafts', 'Hashtags', 'Rewrites', 'DALL-E Images'],
  },
  user_api_key_perplexity: {
    key: 'user_api_key_perplexity',
    label: 'Perplexity API Key',
    description: 'Real-time web search for AI tool discovery. When not configured, research uses Gemini with web grounding instead.',
    placeholder: 'pplx-...',
    getKeyUrl: 'https://www.perplexity.ai/settings/api',
    getKeyLabel: 'Get Key at Perplexity',
    isRequired: false,
    usedFor: ['AI Research'],
  },
  user_api_key_firecrawl: {
    key: 'user_api_key_firecrawl',
    label: 'Firecrawl API Key',
    description: 'Scrapes detailed content from discovered tool websites. When not configured, only AI summaries are shown (no full scraped content dropdown).',
    placeholder: 'fc-...',
    getKeyUrl: 'https://www.firecrawl.dev/app/api-keys',
    getKeyLabel: 'Get Key at Firecrawl',
    isRequired: false,
    usedFor: ['Web Scraping'],
  },
};

// Mask key showing first 3 and last 4 characters
function maskKey(key: string): string {
  if (!key || key.length < 10) return key ? '••••••••' : '';
  return `${key.substring(0, 3)}...${key.substring(key.length - 4)}`;
}

interface KeyInputProps {
  config: APIKeyConfig;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
  isSaving: boolean;
  isConfigured: boolean;
  t: any;
}

function KeyInput({ config, value, onChange, onSave, onRemove, isSaving, isConfigured, t }: KeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!isConfigured);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (!isConfigured) {
      setIsEditing(true);
    }
  }, [isConfigured]);

  const handleSave = () => {
    if (localValue.trim()) {
      onChange(localValue);
      onSave();
      setIsEditing(false);
      setLocalValue('');
    }
  };

  const handleRemove = () => {
    onChange('');
    onRemove();
    setIsEditing(true);
    setLocalValue('');
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              {config.label}
              {config.isRequired && (
                <Badge variant="destructive" className="text-xs">
                  {t.settingsApiKeys.required}
                </Badge>
              )}
              {!config.isRequired && (
                <Badge variant="outline" className="text-xs">
                  {t.settingsApiKeys.optional}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">{config.description}</CardDescription>
          </div>
          {isConfigured && !isEditing && (
            <Badge variant="secondary" className="shrink-0">
              <CheckCircle className="h-3 w-3 me-1" />
              {t.settingsApiKeys.configured}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* What this key powers */}
        <div className="flex flex-wrap gap-1">
          {config.usedFor.map((use) => (
            <Badge key={use} variant="outline" className="text-xs bg-muted/50">
              {use}
            </Badge>
          ))}
        </div>

        {/* Key input or display */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={config.placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="pe-10 font-mono text-sm"
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <a
                href={config.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {config.getKeyLabel}
              </a>
              <div className="flex gap-2">
                {isConfigured && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    {t.common.cancel}
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={!localValue.trim() || isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-md">
            <code className="text-sm font-mono text-muted-foreground" dir="ltr">
              {maskKey(value)}
            </code>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                {t.settingsApiKeys.update}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRemove} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function APIKeysTab() {
  const { settings, isLoading, upsertSetting } = useSettings();
  const { t } = useLanguage();
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Load existing keys from settings
  useEffect(() => {
    const loadedKeys: Record<string, string> = {};
    Object.keys(API_KEY_CONFIGS).forEach((key) => {
      const setting = settings.find((s) => s.key === key);
      if (setting) {
        try {
          const value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          loadedKeys[key] = typeof value === 'string' ? value : '';
        } catch {
          loadedKeys[key] = '';
        }
      }
    });
    setKeyValues(loadedKeys);
  }, [settings]);

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await upsertSetting.mutateAsync({ key, value });
      setKeyValues((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemove = async (key: string) => {
    setSavingKey(key);
    try {
      await upsertSetting.mutateAsync({ key, value: '' });
      setKeyValues((prev) => ({ ...prev, [key]: '' }));
      toast.success(t.settingsApiKeys.removed);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setSavingKey(null);
    }
  };

  const hasGeminiOrOpenAI = keyValues.user_api_key_gemini || keyValues.user_api_key_openai;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.settingsApiKeys.title}
          </CardTitle>
          <CardDescription>{t.settingsApiKeys.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.settingsApiKeys.securityNote}</AlertDescription>
          </Alert>

          {!hasGeminiOrOpenAI && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t.settingsApiKeys.noKeysWarning}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Object.values(API_KEY_CONFIGS).map((config) => (
          <KeyInput
            key={config.key}
            config={config}
            value={keyValues[config.key] || ''}
            onChange={(value) => setKeyValues((prev) => ({ ...prev, [config.key]: value }))}
            onSave={() => handleSave(config.key, keyValues[config.key] || '')}
            onRemove={() => handleRemove(config.key)}
            isSaving={savingKey === config.key}
            isConfigured={!!keyValues[config.key]}
            t={t}
          />
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">{t.settingsApiKeys.howItWorks}</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>{t.settingsApiKeys.howItWorks1}</li>
            <li>{t.settingsApiKeys.howItWorks2}</li>
            <li>{t.settingsApiKeys.howItWorks3}</li>
            <li>{t.settingsApiKeys.howItWorks4}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

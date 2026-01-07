import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function VoiceStyleTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [voiceSettings, setVoiceSettings] = useState<Record<string, string>>({});

  const VOICE_SETTINGS = {
    creativity_preset: { 
      label: t.settingsVoice.creativityPreset, 
      options: [
        { value: 'conservative', label: t.settingsVoice.options.conservative },
        { value: 'balanced', label: t.settingsVoice.options.balanced },
        { value: 'bold', label: t.settingsVoice.options.bold },
      ]
    },
    default_tone: { 
      label: t.settingsVoice.defaultTone, 
      options: [
        { value: 'founder', label: t.settingsVoice.options.founder },
        { value: 'educational', label: t.settingsVoice.options.educational },
        { value: 'contrarian', label: t.settingsVoice.options.contrarian },
        { value: 'story', label: t.settingsVoice.options.story },
      ]
    },
    default_cta_style: { 
      label: t.settingsVoice.ctaStyle, 
      options: [
        { value: 'question', label: t.settingsVoice.options.question },
        { value: 'soft', label: t.settingsVoice.options.soft },
        { value: 'none', label: t.settingsVoice.options.none },
      ]
    },
    jargon_level: { 
      label: t.settingsVoice.jargonLevel, 
      options: [
        { value: 'low', label: t.settingsVoice.options.low },
        { value: 'medium', label: t.settingsVoice.options.medium },
        { value: 'high', label: t.settingsVoice.options.high },
      ]
    },
    emoji_usage: { 
      label: t.settingsVoice.emojiUsage, 
      options: [
        { value: 'none', label: t.settingsVoice.options.none },
        { value: 'light', label: t.settingsVoice.options.light },
        { value: 'normal', label: t.settingsVoice.options.normal },
      ]
    },
  };

  const getVoiceSetting = (key: string) => {
    if (voiceSettings[key] !== undefined) return voiceSettings[key];
    const setting = getSetting(key);
    return typeof setting === 'string' ? setting : '';
  };

  const handleSaveVoiceSetting = async (key: string, value: string) => {
    setVoiceSettings(prev => ({ ...prev, [key]: value }));
    await upsertSetting.mutateAsync({ key, value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>{t.settingsVoice.title}</CardTitle>
          <CardDescription>
            {t.settingsVoice.description}
            {!isAdmin && <span className="ml-1 text-amber-500">{t.common.adminOnly}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div dir="ltr" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(VOICE_SETTINGS).map(([key, config]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{config.label}</Label>
                <Select
                  value={getVoiceSetting(key)}
                  onValueChange={(value) => handleSaveVoiceSetting(key, value)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger id={key}>
                    <SelectValue placeholder={`${t.settingsVoice.selectPlaceholder} ${config.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="max_length_target">{t.settingsVoice.maxLengthTarget}</Label>
              <Input
                id="max_length_target"
                type="number"
                value={getVoiceSetting('max_length_target') || '1500'}
                onChange={(e) => handleSaveVoiceSetting('max_length_target', e.target.value)}
                disabled={!isAdmin}
                min={100}
                max={5000}
              />
              <p className="text-xs text-muted-foreground">{t.settingsVoice.maxLengthDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';

const VOICE_SETTINGS = {
  creativity_preset: { label: 'Creativity Preset', options: ['conservative', 'balanced', 'bold'] },
  default_tone: { label: 'Default Tone', options: ['founder', 'educational', 'contrarian', 'story'] },
  default_cta_style: { label: 'CTA Style', options: ['question', 'soft', 'none'] },
  jargon_level: { label: 'Jargon Level', options: ['low', 'medium', 'high'] },
  emoji_usage: { label: 'Emoji Usage', options: ['none', 'light', 'normal'] },
};

export function VoiceStyleTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { isAdmin } = useAuth();
  const [voiceSettings, setVoiceSettings] = useState<Record<string, string>>({});

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
          <CardTitle>Voice & Style Settings</CardTitle>
          <CardDescription>
            Configure the tone and style for AI-generated content. These settings affect how rewrite actions and content generation behave.
            {!isAdmin && <span className="ml-1 text-amber-500">(View only - Admin access required)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(VOICE_SETTINGS).map(([key, config]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{config.label}</Label>
              <div dir="ltr">
                <Select
                  value={getVoiceSetting(key)}
                  onValueChange={(value) => handleSaveVoiceSetting(key, value)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger id={key}>
                    <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="max_length_target">Max Length Target</Label>
            <Input
              id="max_length_target"
              type="number"
              value={getVoiceSetting('max_length_target') || '1500'}
              onChange={(e) => handleSaveVoiceSetting('max_length_target', e.target.value)}
              disabled={!isAdmin}
              min={100}
              max={5000}
            />
            <p className="text-xs text-muted-foreground">Target character count for post content</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

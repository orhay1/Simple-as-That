import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';

const IMAGE_MODELS = [
  { 
    value: 'google/imagen-4', 
    label: 'Google Imagen 4', 
    description: 'High quality image generation (default)',
    requiresKey: false
  },
  { 
    value: 'openai/dall-e-3', 
    label: 'OpenAI DALL-E 3', 
    description: 'Requires OpenAI API key',
    requiresKey: true
  },
];

export function ImageSettingsTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { t } = useLanguage();
  const [localModel, setLocalModel] = useState<string | null>(null);

  const getImageModel = () => {
    if (localModel !== null) return localModel;
    const setting = getSetting('image_generation_model');
    return typeof setting === 'string' ? setting : 'google/imagen-4';
  };

  const handleModelChange = async (value: string) => {
    setLocalModel(value);
    await upsertSetting.mutateAsync({ key: 'image_generation_model', value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>{t.settingsImages.title}</CardTitle>
          <CardDescription>
            {t.settingsImages.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div dir="ltr" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image_generation_model">{t.settingsImages.modelLabel}</Label>
              <div className="w-full max-w-md">
                <Select
                  value={getImageModel()}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger id="image_generation_model">
                    <SelectValue placeholder="Select image model" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">{t.settingsImages.modelNotes}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Gemini models</strong> {t.settingsImages.geminiNote}</li>
                <li>• <strong>DALL-E 3</strong> {t.settingsImages.dalleNote}</li>
                <li>• {t.settingsImages.flashNote}</li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                {t.settingsImages.accessTip}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

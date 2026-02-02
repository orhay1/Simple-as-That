import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImageModel {
  value: string;
  label: string;
  description: string;
  tier: 'free' | 'paid';
}

const IMAGE_MODELS: ImageModel[] = [
  { 
    value: 'nano-banana-free', 
    label: 'Nano Banana', 
    description: '500 free images/day • Fast generation',
    tier: 'free',
  },
  { 
    value: 'nano-banana-pro', 
    label: 'Nano Banana Pro', 
    description: 'Highest quality • Requires paid Gemini API',
    tier: 'paid',
  },
  { 
    value: 'openai/dall-e-3', 
    label: 'DALL-E 3', 
    description: 'Requires OpenAI API key with credits',
    tier: 'paid',
  },
];

export function ImageSettingsTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { t } = useLanguage();
  const [localModel, setLocalModel] = useState<string | null>(null);

  const getImageModel = () => {
    if (localModel !== null) return localModel;
    const setting = getSetting('image_generation_model');
    return typeof setting === 'string' ? setting : 'nano-banana-free';
  };

  const handleModelChange = async (value: string) => {
    setLocalModel(value);
    await upsertSetting.mutateAsync({ key: 'image_generation_model', value });
  };

  const selectedModel = IMAGE_MODELS.find(m => m.value === getImageModel());

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
                    <SelectValue placeholder="Select image model">
                      {selectedModel && (
                        <div className="flex items-center gap-2">
                          <span>{selectedModel.label}</span>
                          <Badge 
                            variant={selectedModel.tier === 'free' ? 'default' : 'secondary'}
                            className={selectedModel.tier === 'free' 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' 
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }
                          >
                            {selectedModel.tier === 'free' ? 'Free' : 'Paid'}
                          </Badge>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.label}</span>
                              <Badge 
                                variant={model.tier === 'free' ? 'default' : 'secondary'}
                                className={model.tier === 'free' 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs' 
                                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs'
                                }
                              >
                                {model.tier === 'free' ? 'Free' : 'Paid'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
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
                <li>• <strong>Nano Banana</strong> — {t.settingsImages.geminiNote}</li>
                <li>• <strong>Nano Banana Pro</strong> — {t.settingsImages.flashNote}</li>
                <li>• <strong>DALL-E 3</strong> — {t.settingsImages.dalleNote}</li>
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

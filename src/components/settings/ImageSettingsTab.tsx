import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from 'lucide-react';

const IMAGE_MODELS = [
  { 
    value: 'google/gemini-3-pro-image-preview', 
    label: 'Gemini 3 Pro Image', 
    description: 'Higher quality, default choice',
    requiresKey: false
  },
  { 
    value: 'google/gemini-2.5-flash-image', 
    label: 'Gemini 2.5 Flash Image', 
    description: 'Faster generation',
    requiresKey: false
  },
  { 
    value: 'openai/gpt-image-1', 
    label: 'OpenAI DALL-E 3', 
    description: 'Requires API key',
    requiresKey: true
  },
];

export function ImageSettingsTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [localModel, setLocalModel] = useState<string | null>(null);

  const getImageModel = () => {
    if (localModel !== null) return localModel;
    const setting = getSetting('image_generation_model');
    return typeof setting === 'string' ? setting : 'google/gemini-3-pro-image-preview';
  };

  const handleModelChange = async (value: string) => {
    setLocalModel(value);
    await upsertSetting.mutateAsync({ key: 'image_generation_model', value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Image Generation Settings</CardTitle>
          <CardDescription>
            Choose the AI model for generating images for your LinkedIn posts
            {!isAdmin && <span className="ml-1 text-amber-500">(View only - Admin access required)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image_generation_model">Image Generation Model</Label>
            <Select
              value={getImageModel()}
              onValueChange={handleModelChange}
              disabled={!isAdmin}
            >
              <SelectTrigger id="image_generation_model" className="w-full max-w-md">
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

          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm">Model Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Gemini models</strong> use Lovable AI - no additional API key required</li>
              <li>• <strong>DALL-E 3</strong> requires an OpenAI API key configured in secrets</li>
              <li>• Flash model is faster but may have slightly lower quality</li>
            </ul>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">
              You can access this setting from the draft editor via the Image dropdown → "Choose Model"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

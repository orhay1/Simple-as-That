import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptItemProps {
  title: string;
  settingKey: string;
  description: string;
  placeholders?: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
}

function PromptItem({ title, description, placeholders, value, onChange, onSave, isSaving, disabled }: PromptItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50">
        <div>
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-accordion-down">
        <div className="mt-2 space-y-3 rounded-lg border border-border bg-card/50 p-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter prompt..."
            className="min-h-[150px] resize-y"
            disabled={disabled}
          />
          {placeholders && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Available placeholders:</span> {placeholders}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{value.length} characters</span>
            <Button onClick={onSave} disabled={disabled || isSaving} size="sm">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const PROMPT_CONFIGS = [
  { key: 'topic_generator_prompt', title: 'Topic Generator Prompt', description: 'Generates topic ideas for content', placeholders: '{context}' },
  { key: 'draft_generator_prompt', title: 'Draft Generator Prompt', description: 'Creates post drafts from topics', placeholders: '{title}, {hook}, {rationale}, {topic_id}' },
  { key: 'hashtag_generator_prompt', title: 'Hashtag Generator Prompt', description: 'Generates relevant hashtags', placeholders: '{title}, {body}' },
  { key: 'image_generator_prompt', title: 'Image Generator Prompt', description: 'Creates image descriptions and prompts', placeholders: '{title}, {body}' },
];

const VOICE_SETTINGS = {
  creativity_preset: { label: 'Creativity Preset', options: ['conservative', 'balanced', 'bold'] },
  default_tone: { label: 'Default Tone', options: ['founder', 'educational', 'contrarian', 'story'] },
  default_cta_style: { label: 'CTA Style', options: ['question', 'soft', 'none'] },
  jargon_level: { label: 'Jargon Level', options: ['low', 'medium', 'high'] },
  emoji_usage: { label: 'Emoji Usage', options: ['none', 'light', 'normal'] },
};

export function PromptsTab() {
  const { getSetting, updateSetting, upsertSetting } = useSettings();
  const { isManager } = useAuth();
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [voiceSettings, setVoiceSettings] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const getPromptValue = (key: string) => {
    if (prompts[key] !== undefined) return prompts[key];
    const setting = getSetting(key);
    return typeof setting === 'string' ? setting : '';
  };

  const getVoiceSetting = (key: string) => {
    if (voiceSettings[key] !== undefined) return voiceSettings[key];
    const setting = getSetting(key);
    return typeof setting === 'string' ? setting : '';
  };

  const handleSavePrompt = async (key: string) => {
    setSavingKey(key);
    try {
      await upsertSetting.mutateAsync({ key, value: prompts[key] || getPromptValue(key) });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveVoiceSetting = async (key: string, value: string) => {
    setVoiceSettings(prev => ({ ...prev, [key]: value }));
    await upsertSetting.mutateAsync({ key, value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Content Generation Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Content Generation Prompts</CardTitle>
          <CardDescription>
            Customize AI prompts for each stage of content creation
            {!isManager && <span className="ml-1 text-amber-500">(View only - Manager access required)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROMPT_CONFIGS.map((config) => (
            <PromptItem
              key={config.key}
              settingKey={config.key}
              title={config.title}
              description={config.description}
              placeholders={config.placeholders}
              value={getPromptValue(config.key)}
              onChange={(value) => setPrompts(prev => ({ ...prev, [config.key]: value }))}
              onSave={() => handleSavePrompt(config.key)}
              isSaving={savingKey === config.key}
              disabled={!isManager}
            />
          ))}
        </CardContent>
      </Card>

      {/* Voice & Style Settings */}
      <Card>
        <CardHeader>
          <Collapsible open={isVoiceOpen} onOpenChange={setIsVoiceOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
              <div>
                <CardTitle>Voice & Style Settings</CardTitle>
                <CardDescription>Configure default tone and style preferences</CardDescription>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isVoiceOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <CardContent className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(VOICE_SETTINGS).map(([key, config]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{config.label}</Label>
                    <Select
                      value={getVoiceSetting(key)}
                      onValueChange={(value) => handleSaveVoiceSetting(key, value)}
                      disabled={!isManager}
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
                ))}
                <div className="space-y-2">
                  <Label htmlFor="max_length_target">Max Length Target</Label>
                  <Input
                    id="max_length_target"
                    type="number"
                    value={getVoiceSetting('max_length_target') || '1500'}
                    onChange={(e) => handleSaveVoiceSetting('max_length_target', e.target.value)}
                    disabled={!isManager}
                    min={100}
                    max={5000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topics_per_run">Topics Per Run</Label>
                  <Input
                    id="topics_per_run"
                    type="number"
                    value={getVoiceSetting('topics_per_run') || '5'}
                    onChange={(e) => handleSaveVoiceSetting('topics_per_run', e.target.value)}
                    disabled={!isManager}
                    min={1}
                    max={20}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Image Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Image Generation</CardTitle>
          <CardDescription>
            Choose the AI model for generating images
            {!isManager && <span className="ml-1 text-amber-500">(View only - Manager access required)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="image_generation_model">Image Model</Label>
            <Select
              value={getVoiceSetting('image_generation_model') || 'google/gemini-3-pro-image-preview'}
              onValueChange={(value) => handleSaveVoiceSetting('image_generation_model', value)}
              disabled={!isManager}
            >
              <SelectTrigger id="image_generation_model">
                <SelectValue placeholder="Select image model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google/gemini-3-pro-image-preview">
                  Gemini 3 Pro Image (Higher Quality, Default)
                </SelectItem>
                <SelectItem value="google/gemini-2.5-flash-image-preview">
                  Gemini 2.5 Flash Image (Faster)
                </SelectItem>
                <SelectItem value="openai/gpt-image-1">
                  OpenAI DALL-E 3 (Requires API Key)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Gemini models use Lovable AI. OpenAI DALL-E 3 requires a separate API key configured in secrets.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

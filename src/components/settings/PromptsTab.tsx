import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, Save, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptItemProps {
  title: string;
  description: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  disabled: boolean;
}

function PromptItem({ title, description, value, defaultValue, onChange, onSave, onReset, isSaving, disabled }: PromptItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isModified = value !== defaultValue && value !== '';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50">
        <div className="flex items-center gap-2">
          <div>
            <h4 className="font-medium text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {isModified && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Modified</span>
          )}
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-accordion-down">
        <div className="mt-2 space-y-3 rounded-lg border border-border bg-card/50 p-4">
          <Textarea
            value={value || defaultValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter prompt..."
            className="min-h-[200px] resize-y font-mono text-sm"
            disabled={disabled}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{(value || defaultValue).length} characters</span>
            <div className="flex gap-2">
              <Button 
                onClick={onReset} 
                disabled={disabled || !isModified} 
                size="sm" 
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={onSave} disabled={disabled || isSaving} size="sm">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Default prompts
export const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI tools researcher. Find practical AI tools that developers and professionals can use immediately.

OUTPUT FORMAT - Return a JSON array. Each tool must have:
- title: Tool name + one-line hook (max 60 chars)
- summary: Brief 2-sentence description of what it does
- source_url: Official website or GitHub URL
- tool_name: The exact tool/project name
- tags: 3-5 tags like ["open-source", "llm", "coding", "free"]

FOCUS ON:
- GitHub trending AI repos (include star count)
- Taaft and "There's An AI For That" recent additions
- Tools launched in the last 14 days
- Free or freemium tools with clear practical value

Return ONLY a valid JSON array, no markdown formatting.`;

export const DEFAULT_PERPLEXITY_USER_PROMPT = `Find the latest practical AI tools. Focus on ready-to-use tools with good documentation.`;

export const DEFAULT_POLISH_PROMPT = `Transform this AI tool data into a polished LinkedIn post summary.

TOOL: {tool_name}
DATA: {summary}
{context}

Write 2-3 SHORT paragraphs (150-200 words total):
- Opening: One punchy sentence about the problem it solves
- Middle: What it does and one key benefit (use specific numbers if available)
- End: Who should try it (be specific)

STYLE RULES:
- Write like you're texting a smart colleague, not writing a blog
- No buzzwords: avoid "revolutionary", "game-changer", "cutting-edge"
- No filler phrases: avoid "This tool...", "It provides...", "You can..."
- Start sentences with actions or results, not subjects
- Include GitHub stars or user count if available

Return ONLY the summary text. No headers, no formatting, no quotes.`;

const PROMPTS_CONFIG = [
  { 
    key: 'perplexity_system_prompt', 
    title: 'AI Research System Prompt', 
    description: 'Instructions for finding and analyzing AI tools',
    defaultValue: DEFAULT_PERPLEXITY_SYSTEM_PROMPT
  },
  { 
    key: 'perplexity_user_prompt', 
    title: 'AI Research Query', 
    description: 'Default search query for discovering tools',
    defaultValue: DEFAULT_PERPLEXITY_USER_PROMPT
  },
  { 
    key: 'research_polish_prompt', 
    title: 'Summary Polish Prompt', 
    description: 'Transforms raw research into LinkedIn-ready summaries',
    defaultValue: DEFAULT_POLISH_PROMPT
  },
  { 
    key: 'hashtag_generator_prompt', 
    title: 'Hashtag Generator Prompt', 
    description: 'Generates relevant hashtags for posts',
    defaultValue: 'Generate strategic LinkedIn hashtags for maximum reach and engagement.'
  },
  { 
    key: 'image_generator_prompt', 
    title: 'Image Generator Prompt', 
    description: 'Creates image descriptions for AI generation',
    defaultValue: 'Create a professional, LinkedIn-appropriate image description.'
  },
];

export function PromptsTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { isAdmin } = useAuth();
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const getPromptValue = (key: string, defaultValue: string) => {
    if (prompts[key] !== undefined) return prompts[key];
    const setting = getSetting(key);
    return typeof setting === 'string' ? setting : '';
  };

  const handleSavePrompt = async (key: string, defaultValue: string) => {
    setSavingKey(key);
    try {
      const value = prompts[key] || getPromptValue(key, defaultValue) || defaultValue;
      await upsertSetting.mutateAsync({ key, value });
    } finally {
      setSavingKey(null);
    }
  };

  const handleReset = async (key: string, defaultValue: string) => {
    setPrompts(prev => ({ ...prev, [key]: defaultValue }));
    setSavingKey(key);
    try {
      await upsertSetting.mutateAsync({ key, value: defaultValue });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>AI Prompts</CardTitle>
          <CardDescription>
            Configure prompts for research, content generation, and images
            {!isAdmin && <span className="ml-1 text-amber-500">(View only - Admin access required)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROMPTS_CONFIG.map((config) => (
            <PromptItem
              key={config.key}
              title={config.title}
              description={config.description}
              value={getPromptValue(config.key, config.defaultValue)}
              defaultValue={config.defaultValue}
              onChange={(value) => setPrompts(prev => ({ ...prev, [config.key]: value }))}
              onSave={() => handleSavePrompt(config.key, config.defaultValue)}
              onReset={() => handleReset(config.key, config.defaultValue)}
              isSaving={savingKey === config.key}
              disabled={!isAdmin}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

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
export const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI tools researcher and analyst. Your task is to find and analyze practical AI tools that developers and professionals can use.

RESEARCH FOCUS:
- New AI tools launched on GitHub, Product Hunt, or dedicated AI tool directories
- Practical tools from Taaft, There's An AI For That, and similar directories
- Open source AI projects gaining traction
- AI-powered developer tools and productivity apps

OUTPUT REQUIREMENTS:
For each tool, provide a structured analysis:
1. title: Clear tool name and one-line description (max 80 chars)
2. summary: A structured summary including:
   - What it does (2-3 sentences)
   - How to use it (key features/workflow)
   - Main benefits and use cases
   - Any notable limitations or requirements
3. source_url: The official website, GitHub repo, or authoritative source
4. tool_name: The specific tool/project name
5. tags: Array of 3-5 tags like ["open-source", "llm", "coding", "productivity", "free", "api"]

QUALITY CRITERIA:
- Prioritize tools launched or updated in the last 14 days
- Focus on tools with clear practical value
- Include GitHub stars/forks for open-source projects when available
- Note pricing (free, freemium, paid) when relevant
- Prefer tools with good documentation

Return a JSON array of 5-7 tools. No markdown, just the JSON array.`;

export const DEFAULT_PERPLEXITY_USER_PROMPT = `Find the latest practical AI tools from:
1. GitHub trending AI repositories
2. Taaft and "There's An AI For That" recent additions
3. Product Hunt AI launches
4. Notable open-source AI projects

Focus on tools that are:
- Ready to use (not just research papers)
- Well-documented
- Solve real problems for developers, creators, or professionals

Provide structured information for creating engaging LinkedIn posts about each tool.`;

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

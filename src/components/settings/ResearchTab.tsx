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

// Default prompts - these are the detailed prompts used by the edge function
export const DEFAULT_PERPLEXITY_SYSTEM_PROMPT = `You are an expert AI industry analyst and researcher specializing in artificial intelligence tools, platforms, and industry developments. Your task is to find and analyze the most significant, recent AI news that would resonate with a professional LinkedIn audience.

RESEARCH FOCUS:
- New AI tool launches and major feature updates
- Funding rounds and acquisitions in the AI space
- Breakthrough research papers with practical applications
- Enterprise AI adoption stories and case studies
- Open source AI releases and community developments
- AI policy and regulatory developments with business impact

OUTPUT REQUIREMENTS:
For each news item, provide:
1. title: A clear, compelling headline (max 100 chars) that captures the essence
2. summary: A 2-3 sentence summary explaining:
   - What happened/was announced
   - Why it matters for professionals
   - Key implications or opportunities
3. source_url: The primary, authoritative source URL (prefer official announcements, reputable tech publications)
4. tool_name: The specific AI tool, company, or platform involved (if applicable)
5. tags: An array of 3-5 relevant tags from categories like:
   - Technology type: ["llm", "image-generation", "video-ai", "voice-ai", "agents", "rag", "fine-tuning"]
   - Use case: ["productivity", "coding", "creative", "enterprise", "research", "automation"]
   - Category: ["launch", "update", "funding", "open-source", "research", "regulation"]

QUALITY CRITERIA:
- Prioritize news from the last 7 days
- Focus on actionable insights, not just announcements
- Avoid rumors or unverified claims
- Prefer items with clear business or practical relevance
- Include a mix of big tech and innovative startups

Return a JSON array of 5-7 high-quality news items. No markdown formatting, just the raw JSON array.`;

export const DEFAULT_PERPLEXITY_USER_PROMPT = `Find the latest and most significant AI tools, launches, and updates from this week. Focus on:
1. Major product launches or significant feature updates from AI companies
2. Notable funding rounds or acquisitions
3. Open source releases that developers should know about
4. Interesting use cases or adoption stories

Prioritize items that would make engaging LinkedIn content for a tech-savvy professional audience.`;

export const DEFAULT_FIRECRAWL_PROMPT = `Extract the main article content including:
- Full article text
- Key quotes and statistics
- Author information if available
- Publication date

Focus on the primary content, excluding navigation, ads, and sidebars.`;

const RESEARCH_PROMPTS = [
  { 
    key: 'perplexity_system_prompt', 
    title: 'Perplexity System Prompt', 
    description: 'System instructions for the AI researcher that searches for news',
    defaultValue: DEFAULT_PERPLEXITY_SYSTEM_PROMPT
  },
  { 
    key: 'perplexity_user_prompt', 
    title: 'Perplexity Search Query', 
    description: 'Default search query sent to find AI news',
    defaultValue: DEFAULT_PERPLEXITY_USER_PROMPT
  },
  { 
    key: 'firecrawl_prompt', 
    title: 'Firecrawl Extraction Prompt', 
    description: 'Instructions for extracting content from source URLs',
    defaultValue: DEFAULT_FIRECRAWL_PROMPT
  },
];

export function ResearchTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { isManager } = useAuth();
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
          <CardTitle>AI News Research Prompts</CardTitle>
          <CardDescription>
            Configure prompts for Perplexity (news search) and Firecrawl (content extraction)
            {!isManager && <span className="ml-1 text-amber-500">(View only - Manager access required)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {RESEARCH_PROMPTS.map((config) => (
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
              disabled={!isManager}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

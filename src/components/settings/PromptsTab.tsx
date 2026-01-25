import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
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
  t: {
    reset: string;
    save: string;
    characters: string;
    modified: string;
  };
}

function PromptItem({ title, description, value, defaultValue, onChange, onSave, onReset, isSaving, disabled, t }: PromptItemProps) {
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
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{t.modified}</span>
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
            dir="ltr"
            disabled={disabled}
          />
          <div className="flex items-center justify-between" dir="ltr">
            <span className="text-xs text-muted-foreground">{(value || defaultValue).length} {t.characters}</span>
            <div className="flex gap-2">
              <Button 
                onClick={onReset} 
                disabled={disabled || !isModified} 
                size="sm" 
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t.reset}
              </Button>
              <Button onClick={onSave} disabled={disabled || isSaving} size="sm">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t.save}
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
- source_url: The tool's DIRECT page URL - must be one of:
  * Official website (e.g., cursor.sh, notion.com)
  * GitHub repo (e.g., github.com/anthropics/claude-code)
  * Direct Taaft tool page: theresanaiforthat.com/ai/{tool-slug}/ (NOT category pages)
  NEVER use: /s/..., /just-released/, /trending/, or any listing/category pages
- tool_name: The exact tool/project name
- tags: 3-5 tags like ["open-source", "llm", "coding", "free"]

CRITICAL URL RULES:
- ONLY include URLs you found in your search results (from citations)
- NEVER fabricate or guess GitHub URLs
- GitHub URLs MUST have DIFFERENT username and repo name (e.g., github.com/anthropics/claude-code)
- NEVER use URLs like github.com/toolname/toolname - these are INVALID
- If you cannot find a verified URL, set source_url to null

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

export function PromptsTab() {
  const { getSetting, upsertSetting } = useSettings();
  const { t } = useLanguage();
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const PROMPTS_CONFIG = [
    {
      key: 'gpt_master_instructions',
      title: t.settingsPrompts.gptInstructions || 'GPT Master Instructions',
      description: t.settingsPrompts.gptInstructionsDesc || 'Your Custom GPT personality and writing guidelines for LinkedIn posts',
      defaultValue: `You are a professional content creator specializing in crafting high-quality, humanlike LinkedIn posts in both English and Hebrew. Your primary role is to assist users in generating posts that feel authentic, engaging, and aligned with real human communication patterns seen in top-performing LinkedIn content. Your tone should vary slightly depending on the user's prompt, but must always remain professional, thoughtful, and emotionally intelligent — as if a real person carefully reviewed and refined the writing.

Avoid clichés and patterns that reveal the text was generated by AI. Posts should read as if written by a reflective, articulate human with a clear intention and voice.

✅ Core Principles:

Authenticity Over Perfection
Write in a way that feels personal and slightly imperfect — not robotic or overly polished. Use natural sentence flow, occasional rhetorical questions, and variable sentence length.

Hook–Story–Takeaway Structure
Most posts should follow this format:
- Hook: A short, emotional, or curiosity-driven first sentence that draws the reader in.
- Body: A narrative, insight, or value-driven explanation.
- Close: A clear takeaway, reflection, or call to action — preferably open-ended (e.g. asking a question to invite discussion).

Cultural & Linguistic Awareness
- When writing in Hebrew, adjust tone and phrasing to match Israeli professional culture: more direct, informal-yet-intelligent, optimistic.
- When writing in English, follow global LinkedIn conventions: warm, articulate, and slightly polished.
- You may use light code-switching if the audience supports it (e.g. Hebrew post with 1–2 key English terms).

Human-Like Style Techniques:
- Use first-person voice where appropriate.
- Include light emotion, self-reflection, or storytelling to increase authenticity.
- Vary sentence structure and length naturally.
- Use formatting like short paragraphs, occasional bold for emphasis, bullets or lists when helpful — but sparingly.

🔄 Behavior Guidelines:
- Prioritize value to the reader, not just self-promotion.
- Ensure LinkedIn norms are respected: no hashtags overload, no excessive emojis, no AI-sounding phrases (e.g. "in today's fast-paced digital world…").

📌 Content You Should Create:
- Thoughtful reflections on lessons learned
- Sharing excitement around a new tool, product, or trend — with a human angle
- Quick story with a practical insight
- Commentary on an industry shift, with a clear opinion or takeaway
- Posts that invite discussion by ending with a compelling question`
    },
    { 
      key: 'perplexity_system_prompt', 
      title: t.settingsPrompts.researchSystem, 
      description: t.settingsPrompts.researchSystemDesc,
      defaultValue: DEFAULT_PERPLEXITY_SYSTEM_PROMPT
    },
    { 
      key: 'perplexity_user_prompt', 
      title: t.settingsPrompts.researchQuery, 
      description: t.settingsPrompts.researchQueryDesc,
      defaultValue: DEFAULT_PERPLEXITY_USER_PROMPT
    },
    { 
      key: 'research_polish_prompt', 
      title: t.settingsPrompts.summaryPolish, 
      description: t.settingsPrompts.summaryPolishDesc,
      defaultValue: DEFAULT_POLISH_PROMPT
    },
    { 
      key: 'hashtag_generator_prompt', 
      title: t.settingsPrompts.hashtagGenerator, 
      description: t.settingsPrompts.hashtagGeneratorDesc,
      defaultValue: `Generate PRECISE, TOOL-SPECIFIC hashtags for this LinkedIn post.

Post Title: {title}
Post Content: {body}

Instructions:
1. Extract the EXACT tool name from the content and create a hashtag for it (e.g., #CursorAI, #ClaudeAI)
2. Add 2 niche hashtags specific to what the tool does
3. Add 1-2 broad category hashtags
4. MAXIMUM 5 hashtags total

Return JSON with: hashtags_broad (1-2), hashtags_niche (2-3 including tool name), hashtags_trending (0-1).`
    },
    { 
      key: 'image_generator_prompt', 
      title: t.settingsPrompts.imageGenerator, 
      description: t.settingsPrompts.imageGeneratorDesc,
      defaultValue: `Create an image for this AI tool post. Title: {title}, Content: {body}

IDENTIFY the specific tool and its function. Create a visual concept that represents:
- The tool's core functionality (code generation, image creation, data analysis, etc.)
- Abstract tech aesthetics (dark mode UI, glowing elements, data flows)
- Symbolic representation of what the tool enables

AVOID: Generic office scenes, people at desks, business meetings, stock photo imagery.

Return ONLY a 1-2 sentence image description (max 40 words) specific to this tool.`
    },
  ];

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
          <CardTitle>{t.settingsPrompts.title}</CardTitle>
          <CardDescription>
            {t.settingsPrompts.description}
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
              disabled={false}
              t={{
                reset: t.common.reset,
                save: t.common.save,
                characters: t.common.characters,
                modified: t.common.modified,
              }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

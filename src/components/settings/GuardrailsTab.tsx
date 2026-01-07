import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useGuardrails } from '@/hooks/useGuardrails';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Plus, Sparkles, Loader2, Save, Check } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  disabled: boolean;
}

function TagInput({ tags, onTagsChange, placeholder, disabled }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            {!disabled && (
              <button onClick={() => removeTag(tag)} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
        />
        <Button type="button" size="sm" onClick={addTag} disabled={disabled || !input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GuardrailsTab() {
  const { guardrails, isLoading, updateGuardrails, suggestGuardrails } = useGuardrails();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [bannedPhrases, setBannedPhrases] = useState<string[]>([]);
  const [disclaimers, setDisclaimers] = useState<string[]>([]);
  const [noClickbait, setNoClickbait] = useState(true);
  const [allowLinks, setAllowLinks] = useState(true);
  const [enforceRules, setEnforceRules] = useState(false);
  const [maxHashtags, setMaxHashtags] = useState(5);
  const [dedupeThreshold, setDedupeThreshold] = useState(0.8);
  
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState<{ banned_phrases?: string[]; disclaimers?: string[]; rules?: string[] } | null>(null);

  useEffect(() => {
    if (guardrails) {
      setBannedPhrases(guardrails.banned_phrases || []);
      setDisclaimers(guardrails.required_disclaimers || []);
      setNoClickbait(guardrails.no_clickbait ?? true);
      setAllowLinks(guardrails.allow_links ?? true);
      setEnforceRules(guardrails.enforce_rules ?? false);
      setMaxHashtags(guardrails.max_hashtags ?? 5);
      setDedupeThreshold(guardrails.dedupe_threshold ?? 0.8);
    }
  }, [guardrails]);

  const handleSave = async () => {
    await updateGuardrails.mutateAsync({
      banned_phrases: bannedPhrases,
      required_disclaimers: disclaimers,
      no_clickbait: noClickbait,
      allow_links: allowLinks,
      enforce_rules: enforceRules,
      max_hashtags: maxHashtags,
      dedupe_threshold: dedupeThreshold,
    });
  };

  const handleGetSuggestions = async () => {
    const result = await suggestGuardrails.mutateAsync(context);
    setSuggestions(result);
  };

  const applySuggestion = (type: 'banned_phrases' | 'disclaimers', items: string[]) => {
    if (type === 'banned_phrases') {
      const merged = [...new Set([...bannedPhrases, ...items])];
      setBannedPhrases(merged);
    } else {
      const merged = [...new Set([...disclaimers, ...items])];
      setDisclaimers(merged);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const disabled = !isAdmin;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Content Rules */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settingsGuardrails.title}</CardTitle>
          <CardDescription>
            {t.settingsGuardrails.description}
            {!isAdmin && <span className="ml-1 text-amber-500">{t.common.adminOnly}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div dir="ltr" className="space-y-6">
            <div className="space-y-2">
              <Label>{t.settingsGuardrails.bannedPhrases}</Label>
              <p className="text-sm text-muted-foreground">{t.settingsGuardrails.bannedPhrasesDesc}</p>
              <TagInput tags={bannedPhrases} onTagsChange={setBannedPhrases} placeholder={t.settingsGuardrails.addBannedPlaceholder} disabled={disabled} />
            </div>

            <div className="space-y-2">
              <Label>{t.settingsGuardrails.disclaimers}</Label>
              <p className="text-sm text-muted-foreground">{t.settingsGuardrails.disclaimersDesc}</p>
              <TagInput tags={disclaimers} onTagsChange={setDisclaimers} placeholder={t.settingsGuardrails.addDisclaimerPlaceholder} disabled={disabled} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="no-clickbait">{t.settingsGuardrails.noClickbait}</Label>
                  <p className="text-sm text-muted-foreground">{t.settingsGuardrails.noClickbaitDesc}</p>
                </div>
                <Switch id="no-clickbait" checked={noClickbait} onCheckedChange={setNoClickbait} disabled={disabled} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="allow-links">{t.settingsGuardrails.allowLinks}</Label>
                  <p className="text-sm text-muted-foreground">{t.settingsGuardrails.allowLinksDesc}</p>
                </div>
                <Switch id="allow-links" checked={allowLinks} onCheckedChange={setAllowLinks} disabled={disabled} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="enforce-rules">{t.settingsGuardrails.enforceRules}</Label>
                  <p className="text-sm text-muted-foreground">{t.settingsGuardrails.enforceRulesDesc}</p>
                </div>
                <Switch id="enforce-rules" checked={enforceRules} onCheckedChange={setEnforceRules} disabled={disabled} />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <Label htmlFor="max-hashtags">{t.settingsGuardrails.maxHashtags}: {maxHashtags}</Label>
                <Slider
                  id="max-hashtags"
                  value={[maxHashtags]}
                  onValueChange={([val]) => setMaxHashtags(val)}
                  min={0}
                  max={15}
                  step={1}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.settingsGuardrails.dedupeThreshold}: {(dedupeThreshold * 100).toFixed(0)}%</Label>
              <p className="text-sm text-muted-foreground">{t.settingsGuardrails.dedupeDesc}</p>
              <Slider
                value={[dedupeThreshold]}
                onValueChange={([val]) => setDedupeThreshold(val)}
                min={0.5}
                max={1}
                step={0.05}
                disabled={disabled}
              />
            </div>

            <Button onClick={handleSave} disabled={disabled || updateGuardrails.isPending} className="w-full sm:w-auto">
              {updateGuardrails.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t.settingsGuardrails.saveChanges}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t.settingsGuardrails.aiSuggestions}
            </CardTitle>
            <CardDescription>{t.settingsGuardrails.aiSuggestionsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div dir="ltr" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="context">{t.settingsGuardrails.contextLabel}</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={t.settingsGuardrails.contextPlaceholder}
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={handleGetSuggestions} disabled={!context.trim() || suggestGuardrails.isPending}>
                {suggestGuardrails.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {t.settingsGuardrails.getSuggestions}
              </Button>

              {suggestions && (
                <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h4 className="font-medium text-foreground">{t.settingsGuardrails.suggestions}</h4>
                  
                  {suggestions.banned_phrases && suggestions.banned_phrases.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{t.settingsGuardrails.suggestedBanned}</Label>
                        <Button size="sm" variant="outline" onClick={() => applySuggestion('banned_phrases', suggestions.banned_phrases!)}>
                          <Check className="mr-1 h-3 w-3" /> {t.settingsGuardrails.apply}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.banned_phrases.map((phrase) => (
                          <Badge key={phrase} variant="outline">{phrase}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.disclaimers && suggestions.disclaimers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{t.settingsGuardrails.suggestedDisclaimers}</Label>
                        <Button size="sm" variant="outline" onClick={() => applySuggestion('disclaimers', suggestions.disclaimers!)}>
                          <Check className="mr-1 h-3 w-3" /> {t.settingsGuardrails.apply}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.disclaimers.map((d) => (
                          <Badge key={d} variant="outline">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.rules && suggestions.rules.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t.settingsGuardrails.recommendedRules}</Label>
                      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {suggestions.rules.map((rule, i) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

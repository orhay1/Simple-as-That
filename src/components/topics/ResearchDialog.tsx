import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/hooks/useTranslation';

interface ResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResearch: (query?: string, count?: number, language?: string) => void;
  isResearching: boolean;
  contentLanguage?: string;
}

export function ResearchDialog({ open, onOpenChange, onResearch, isResearching, contentLanguage = 'en' }: ResearchDialogProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [resultCount, setResultCount] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResearch(query || undefined, resultCount, contentLanguage);
  };

  // Preset queries stay in English as they are search terms
  const presetQueries = [
    'GitHub trending AI tools and repos',
    'New AI tools on Taaft this week',
    'Open source AI projects for developers',
    'AI productivity and automation tools',
    'AI coding assistants and dev tools',
    'AI image and video generation tools',
    'AI writing and content creation tools',
    'AI data analysis and visualization tools',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t.research.title}
          </DialogTitle>
          <DialogDescription>
            {t.research.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">{t.research.searchQuery}</Label>
            <Input
              id="query"
              placeholder="e.g., AI tools for video editing..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isResearching}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.research.quickPicks}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {presetQueries.map((preset, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-2 whitespace-normal text-left justify-start"
                  onClick={() => setQuery(preset)}
                  disabled={isResearching}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t.research.numberOfResults}</Label>
              <span className="text-sm font-medium text-muted-foreground">{resultCount}</span>
            </div>
            <Slider
              value={[resultCount]}
              onValueChange={(values) => setResultCount(values[0])}
              min={1}
              max={10}
              step={1}
              disabled={isResearching}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isResearching}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isResearching}>
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.research.searching}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {t.common.search}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

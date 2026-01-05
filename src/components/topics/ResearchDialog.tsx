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

interface ResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResearch: (query?: string) => void;
  isResearching: boolean;
}

export function ResearchDialog({ open, onOpenChange, onResearch, isResearching }: ResearchDialogProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResearch(query || undefined);
  };

  const presetQueries = [
    'GitHub trending AI tools and repos',
    'New AI tools on Taaft this week',
    'Open source AI projects for developers',
    'AI productivity and automation tools',
    'AI coding assistants and dev tools',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Research AI Tools
          </DialogTitle>
          <DialogDescription>
            Search for the latest practical AI tools from GitHub, Taaft, and other sources.
            Results will be summarized for easy LinkedIn post creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Search Query (optional)</Label>
            <Input
              id="query"
              placeholder="e.g., AI tools for video editing..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isResearching}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick picks</Label>
            <div className="flex flex-wrap gap-1.5">
              {presetQueries.map((preset, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setQuery(preset)}
                  disabled={isResearching}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isResearching}>
              Cancel
            </Button>
            <Button type="submit" disabled={isResearching}>
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

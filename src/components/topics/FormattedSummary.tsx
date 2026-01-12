import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, DollarSign, Users, FileText, Calendar, Lightbulb, AlertTriangle, ThumbsUp } from 'lucide-react';

interface FormattedSummaryProps {
  content: string | null;
  compact?: boolean;
}

interface ParsedEvaluation {
  summary?: string;
  pricing?: string;
  targetUsers?: string;
  useCases?: string[];
  documentation?: string;
  maturity?: string;
  differentiator?: string;
  concerns?: string;
  recommendation?: string;
}

function extractSection(content: string, sectionName: string): string | undefined {
  // Match **Section**: content or Section: content
  const patterns = [
    new RegExp(`\\*\\*${sectionName}\\*\\*:\\s*(.+?)(?=\\n\\*\\*|\\n\\n|$)`, 'is'),
    new RegExp(`^${sectionName}:\\s*(.+?)(?=\\n[A-Z]|\\n\\n|$)`, 'ims'),
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractListSection(content: string, sectionName: string): string[] | undefined {
  const section = extractSection(content, sectionName);
  if (!section) return undefined;
  
  // Extract bullet points
  const bullets = section.match(/[-•]\s*(.+)/g);
  if (bullets) {
    return bullets.map(b => b.replace(/^[-•]\s*/, '').trim());
  }
  
  // If no bullets, split by newlines
  const lines = section.split('\n').filter(l => l.trim());
  return lines.length > 1 ? lines : undefined;
}

function parseEvaluation(content: string): ParsedEvaluation | null {
  // Check if content has the expected structure
  if (!content || (!content.includes('**') && !content.includes('Summary:'))) {
    return null;
  }

  return {
    summary: extractSection(content, 'Summary'),
    pricing: extractSection(content, 'Pricing'),
    targetUsers: extractSection(content, 'Target Users'),
    useCases: extractListSection(content, 'Key Use Cases'),
    documentation: extractSection(content, 'Documentation'),
    maturity: extractSection(content, 'Maturity'),
    differentiator: extractSection(content, 'Differentiator'),
    concerns: extractSection(content, 'Concerns'),
    recommendation: extractSection(content, 'Recommendation'),
  };
}

function getPricingBadge(pricing: string) {
  const lower = pricing.toLowerCase();
  if (lower.includes('free') && !lower.includes('freemium')) {
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Free</Badge>;
  }
  if (lower.includes('freemium')) {
    return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Freemium</Badge>;
  }
  if (lower.includes('open-source') || lower.includes('open source')) {
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Open Source</Badge>;
  }
  if (lower.includes('paid')) {
    return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Paid</Badge>;
  }
  return <Badge variant="secondary">{pricing}</Badge>;
}

function getRecommendationIcon(recommendation: string) {
  const lower = recommendation.toLowerCase();
  if (lower.includes('yes') || lower.includes('recommend') || lower.includes('כן')) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (lower.includes('maybe') || lower.includes('conditional') || lower.includes('אולי')) {
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
  if (lower.includes('no') || lower.includes('skip') || lower.includes('לא')) {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  return <ThumbsUp className="h-4 w-4 text-muted-foreground" />;
}

function getDocBadge(documentation: string) {
  const lower = documentation.toLowerCase();
  if (lower.includes('good') || lower.includes('excellent') || lower.includes('comprehensive') || lower.includes('טוב')) {
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Good</Badge>;
  }
  if (lower.includes('limited') || lower.includes('basic') || lower.includes('מוגבל')) {
    return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Limited</Badge>;
  }
  if (lower.includes('none') || lower.includes('missing') || lower.includes('אין')) {
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">None</Badge>;
  }
  return <Badge variant="secondary">{documentation}</Badge>;
}

export function FormattedSummary({ content, compact = false }: FormattedSummaryProps) {
  if (!content) return null;

  const parsed = parseEvaluation(content);

  // Fallback: if parsing fails, show raw content
  if (!parsed || !parsed.summary) {
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {content}
      </p>
    );
  }

  // Compact mode: just show summary
  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{parsed.summary}</p>
        <div className="flex flex-wrap gap-2">
          {parsed.pricing && getPricingBadge(parsed.pricing)}
          {parsed.documentation && getDocBadge(parsed.documentation)}
        </div>
      </div>
    );
  }

  // Full mode: show all sections
  return (
    <div className="space-y-4 text-sm">
      {/* Summary */}
      {parsed.summary && (
        <div className="space-y-1">
          <p className="text-muted-foreground">{parsed.summary}</p>
        </div>
      )}

      {/* Quick badges row */}
      <div className="flex flex-wrap gap-2 items-center">
        {parsed.pricing && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            {getPricingBadge(parsed.pricing)}
          </div>
        )}
        {parsed.documentation && (
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            {getDocBadge(parsed.documentation)}
          </div>
        )}
      </div>

      {/* Target Users */}
      {parsed.targetUsers && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Target Users</span>
          </div>
          <p className="text-muted-foreground ps-5">{parsed.targetUsers}</p>
        </div>
      )}

      {/* Key Use Cases */}
      {parsed.useCases && parsed.useCases.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Key Use Cases</span>
          </div>
          <ul className="text-muted-foreground ps-5 space-y-0.5">
            {parsed.useCases.map((useCase, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-muted-foreground/50 mt-1">•</span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Maturity */}
      {parsed.maturity && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Maturity</span>
          </div>
          <p className="text-muted-foreground ps-5">{parsed.maturity}</p>
        </div>
      )}

      {/* Differentiator */}
      {parsed.differentiator && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Differentiator</span>
          </div>
          <p className="text-muted-foreground ps-5">{parsed.differentiator}</p>
        </div>
      )}

      {/* Concerns */}
      {parsed.concerns && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-yellow-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Concerns</span>
          </div>
          <p className="text-muted-foreground ps-5">{parsed.concerns}</p>
        </div>
      )}

      {/* Recommendation */}
      {parsed.recommendation && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border">
          {getRecommendationIcon(parsed.recommendation)}
          <div className="flex-1">
            <span className="font-medium">Recommendation: </span>
            <span className="text-muted-foreground">{parsed.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

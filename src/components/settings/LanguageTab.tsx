import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Languages } from 'lucide-react';
import { Language } from '@/lib/i18n/translations';

export function LanguageTab() {
  const { uiLanguage, contentLanguage, setUiLanguage, setContentLanguage, t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.settings.languageSettings}
          </CardTitle>
          <CardDescription>{t.settings.languageDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* UI Language */}
          <div className="space-y-2">
            <Label htmlFor="ui-language" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {t.settings.uiLanguage}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.settings.uiLanguageDescription}
            </p>
            <Select
              value={uiLanguage}
              onValueChange={(value) => setUiLanguage(value as Language)}
            >
              <SelectTrigger id="ui-language" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.settings.english}</SelectItem>
                <SelectItem value="he">{t.settings.hebrew}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Language */}
          <div className="space-y-2">
            <Label htmlFor="content-language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t.settings.contentLanguage}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.settings.contentLanguageDescription}
            </p>
            <Select
              value={contentLanguage}
              onValueChange={(value) => setContentLanguage(value as Language)}
            >
              <SelectTrigger id="content-language" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.settings.english}</SelectItem>
                <SelectItem value="he">{t.settings.hebrew}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

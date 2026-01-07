import { useLanguage } from '@/contexts/LanguageContext';

export function useTranslation() {
  const { t, uiLanguage, direction, isRTL } = useLanguage();
  return { t, language: uiLanguage, direction, isRTL };
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Language, translations, Translations } from '@/lib/i18n/translations';

interface LanguageContextType {
  uiLanguage: Language;
  contentLanguage: Language;
  setUiLanguage: (lang: Language) => Promise<void>;
  setContentLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { user } = useAuth();
  const [uiLanguage, setUiLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('ui_language');
    return (stored as Language) || 'en';
  });
  const [contentLanguage, setContentLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('content_language');
    return (stored as Language) || 'en';
  });

  // Load language preferences from profile when user logs in
  useEffect(() => {
    async function loadLanguagePreferences() {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('ui_language, content_language')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.ui_language) {
          setUiLanguageState(profile.ui_language as Language);
          localStorage.setItem('ui_language', profile.ui_language);
        }
        if (profile.content_language) {
          setContentLanguageState(profile.content_language as Language);
          localStorage.setItem('content_language', profile.content_language);
        }
      }
    }

    loadLanguagePreferences();
  }, [user]);

  // Apply direction to document
  useEffect(() => {
    const direction = uiLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', uiLanguage);
  }, [uiLanguage]);

  const setUiLanguage = async (lang: Language) => {
    setUiLanguageState(lang);
    localStorage.setItem('ui_language', lang);

    if (user) {
      await supabase
        .from('profiles')
        .update({ ui_language: lang })
        .eq('user_id', user.id);
    }
  };

  const setContentLanguage = async (lang: Language) => {
    setContentLanguageState(lang);
    localStorage.setItem('content_language', lang);

    if (user) {
      await supabase
        .from('profiles')
        .update({ content_language: lang })
        .eq('user_id', user.id);
    }
  };

  const direction = uiLanguage === 'he' ? 'rtl' : 'ltr';
  const isRTL = uiLanguage === 'he';

  const value: LanguageContextType = {
    uiLanguage,
    contentLanguage,
    setUiLanguage,
    setContentLanguage,
    t: translations[uiLanguage],
    direction,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

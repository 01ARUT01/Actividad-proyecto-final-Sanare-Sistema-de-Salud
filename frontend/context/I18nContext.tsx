import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Lang,
  LOCALES,
  Params,
  getCurrentLang,
  setCurrentLang,
  translate,
} from '../i18n';

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Params) => string;
  locale: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => getCurrentLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setCurrentLang(next);
    try {
      localStorage.setItem('lang', next);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string, params?: Params) => translate(lang, key, params), [lang]);

  const value = useMemo<I18nContextType>(
    () => ({ lang, setLang, t, locale: LOCALES[lang] }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
};
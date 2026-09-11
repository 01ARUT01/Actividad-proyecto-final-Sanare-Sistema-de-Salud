import es from './locales/es';
import en from './locales/en';
import pt from './locales/pt';
import zh from './locales/zh';

export type Lang = 'es' | 'en' | 'pt' | 'zh';
export type Messages = typeof es;
export type Params = Record<string, string | number>;

export const LANG_CODES: Lang[] = ['es', 'en', 'pt', 'zh'];

export const LOCALES: Record<Lang, string> = {
  es: 'es-AR',
  en: 'en-US',
  pt: 'pt-BR',
  zh: 'zh-CN',
};

export const LANG_LABELS: Record<Lang, string> = {
  es: '🇪🇸 Español',
  en: '🇬🇧 English',
  pt: '🇵🇹 Português',
  zh: '中文',
};

const dictionaries: Record<Lang, Messages> = { es, en, pt, zh };

const STORAGE_KEY = 'lang';

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANG_CODES as string[]).includes(stored)) return stored as Lang;
  } catch {
    /* noop */
  }
  return 'es';
}

export function translate(lang: Lang, key: string, params?: Params): string {
  let value: string | undefined = dictionaries[lang][key as keyof Messages];
  if (value === undefined) value = dictionaries.es[key as keyof Messages];
  if (value === undefined) return key;
  if (params) {
    let result = value;
    Object.entries(params).forEach(([name, val]) => {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), String(val));
    });
    return result;
  }
  return value;
}

// Estado de idioma a nivel de módulo (accesible desde services, fuera de React)
let currentLang: Lang = readStoredLang();
export const getCurrentLang = (): Lang => currentLang;
export const setCurrentLang = (lang: Lang): void => {
  currentLang = lang;
};
export const tt = (key: string, params?: Params): string => translate(currentLang, key, params);

// Plural helpers
export const plural = (n: number, oneKey: string, manyKey: string): string =>
  n === 1 ? tt(oneKey) : tt(manyKey);
export const pluralCount = (n: number, key: string): string => tt(key, { n });
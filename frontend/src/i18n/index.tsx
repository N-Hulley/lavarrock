import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en, type TranslationKeys } from './locales/en';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

type Translations = TranslationKeys;

// Type-safe translation key path
type Path<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? Path<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

export type TranslationKey = Path<TranslationKeys>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const DEFAULT_LOCALE: Locale = 'en';

/**
 * Load translations for a specific locale
 */
async function loadTranslations(locale: Locale): Promise<Translations> {
  try {
    const module = await import(`./locales/${locale}.ts`);
    return module[locale] as Translations;
  } catch (error) {
    console.warn(`Failed to load translations for locale: ${locale}, falling back to English`);
    return en;
  }
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Replace template variables in a string (e.g., "{{count}} items" with params: {count: 5})
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Try to get locale from localStorage or browser
    const saved = localStorage.getItem('lavarrock:locale');
    if (saved && ['en', 'es', 'fr', 'de', 'ja', 'zh'].includes(saved)) {
      return saved as Locale;
    }
    
    // Try to get from browser
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es', 'fr', 'de', 'ja', 'zh'].includes(browserLang)) {
      return browserLang as Locale;
    }
    
    return DEFAULT_LOCALE;
  });
  
  const [translations, setTranslations] = useState<Translations>(en);

  useEffect(() => {
    loadTranslations(locale).then(setTranslations);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('lavarrock:locale', newLocale);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations, key);
    
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }
    
    return interpolate(value, params);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Get localized string from a manifest's localized strings
 */
export function getLocalizedString(
  localizedStrings: Record<string, string> | undefined,
  locale: string,
  fallback: string = ''
): string {
  if (!localizedStrings) return fallback;
  
  // Try exact locale match (e.g., "en-US")
  if (localizedStrings[locale]) {
    return localizedStrings[locale];
  }
  
  // Try language code only (e.g., "en")
  const langCode = locale.split('-')[0];
  if (localizedStrings[langCode]) {
    return localizedStrings[langCode];
  }
  
  // Try English as fallback
  if (localizedStrings['en']) {
    return localizedStrings['en'];
  }
  
  // Return first available translation
  const firstKey = Object.keys(localizedStrings)[0];
  return localizedStrings[firstKey] || fallback;
}

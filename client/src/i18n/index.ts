import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zh } from './locales/zh';
import { en } from './locales/en';

export type Language = 'zh' | 'en';

export type TranslationKeys = typeof zh;

const translations: Record<Language, TranslationKeys> = {
  zh,
  en,
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'zh',
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: string, params?: Record<string, string | number>) => {
        const lang = get().language;
        const keys = key.split('.');
        let value: any = translations[lang];

        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            // Fallback to Chinese if key not found
            value = translations['zh'];
            for (const k2 of keys) {
              if (value && typeof value === 'object' && k2 in value) {
                value = value[k2];
              } else {
                return key; // Return key if not found
              }
            }
            break;
          }
        }

        let result = typeof value === 'string' ? value : key;

        // Handle interpolation: replace {{variable}} with params
        if (params) {
          Object.entries(params).forEach(([paramKey, paramValue]) => {
            result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
          });
        }

        return result;
      },
    }),
    {
      name: 'sodex-language',
    }
  )
);

// Helper hook for components
export const useTranslation = () => {
  const { language, setLanguage, t } = useLanguage();
  return { language, setLanguage, t };
};

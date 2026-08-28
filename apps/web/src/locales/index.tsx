import { createContext, useContext, useState } from "react";
import en from "./en";
import hi from "./hi";

export type Language = "en" | "hi";

export type TranslationKeys = typeof en;

export interface LocalizationContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

export const LocalizationContext = createContext<LocalizationContextValue | null>(null);

const translations: Record<Language, TranslationKeys> = { en, hi };

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const t = getTranslation(language);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error("useLocalization must be used within LocalizationProvider");
  return ctx;
}

export function getTranslation(language: Language): TranslationKeys {
  return translations[language] || en;
}

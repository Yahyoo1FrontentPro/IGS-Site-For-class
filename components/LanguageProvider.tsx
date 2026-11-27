"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppLanguage } from "@/types";
import { getTranslations, TRANSLATIONS } from "@/lib/i18n";

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  t: (typeof TRANSLATIONS)[AppLanguage];
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: TRANSLATIONS.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        "igs-myp3-lang"
      ) as AppLanguage | null;
      if (stored === "en" || stored === "ru") {
        setLangState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    try {
      window.localStorage.setItem("igs-myp3-lang", next);
      document.documentElement.lang = next;
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "ru" : "en");
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: getTranslations(lang),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

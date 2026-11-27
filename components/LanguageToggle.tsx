"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={
        lang === "en"
          ? "Switch language to Russian (Русский)"
          : "Switch language to English"
      }
      aria-label="Toggle language"
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800"
    >
      <Languages className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      <span>{lang === "en" ? "RU" : "EN"}</span>
    </button>
  );
}

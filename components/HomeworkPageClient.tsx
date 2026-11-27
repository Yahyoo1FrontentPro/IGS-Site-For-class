"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  LogIn,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { HomeworkAssignment, SessionUser } from "@/types";
import { formatShortDate, getTodayDateISO } from "@/lib/calculations";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { useHideOnMobileScroll } from "@/lib/useHideOnMobileScroll";

interface HomeworkPageClientProps {
  initialHomework: HomeworkAssignment[];
  sessionUser: SessionUser | null;
}

const COMPLETED_STORAGE_KEY = "igs-myp3-completed-hw-v1";

function getDueBadge(
  dueDate: string,
  todayIso: string,
  t: ReturnType<typeof useLanguage>["t"]
) {
  const dueMs = new Date(`${dueDate}T00:00:00`).getTime();
  const todayMs = new Date(`${todayIso}T00:00:00`).getTime();
  const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: t.hwOverdue,
      cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
    };
  }
  if (diffDays === 0) {
    return {
      label: t.hwDueToday,
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    };
  }
  if (diffDays === 1) {
    return {
      label: t.hwDueTomorrow,
      cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300",
    };
  }
  return {
    label: `${t.hwDueInDays} ${diffDays} ${t.hwDays}`,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  };
}

export function HomeworkPageClient({
  initialHomework,
  sessionUser,
}: HomeworkPageClientProps) {
  const { t } = useLanguage();
  const hideHeaderOnMobile = useHideOnMobileScroll();
  const todayIso = getTodayDateISO();

  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPLETED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCompletedIds(parsed as string[]);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const subjectNames = useMemo(() => {
    const set = new Set<string>();
    initialHomework.forEach((h) => set.add(h.subject_name));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initialHomework]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialHomework.filter((h) => {
      if (selectedSubject !== "all" && h.subject_name !== selectedSubject) {
        return false;
      }
      if (
        q.length > 0 &&
        !h.title.toLowerCase().includes(q) &&
        !h.description.toLowerCase().includes(q) &&
        !h.subject_name.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [initialHomework, selectedSubject, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-navy-950">
      <header
        className={`sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-navy-900/95 ${
          hideHeaderOnMobile ? "-translate-y-full md:translate-y-0" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.navBackToHub}
            </Link>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 sm:text-base dark:text-white">
                {t.hwHeaderTitle}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.hwHeaderSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionUser ? (
              <>
                {sessionUser.role === "admin" && (
                  <Link
                    href="/admin?tab=homework"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t.hwPostNew}
                  </Link>
                )}
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
                >
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  @{sessionUser.username}
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700 dark:bg-blue-600"
              >
                <LogIn className="h-3.5 w-3.5" />
                {t.navLogIn}
              </Link>
            )}
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Bar */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-navy-900">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSubject("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedSubject === "all"
                  ? "bg-navy-800 text-white dark:bg-blue-600"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300"
              }`}
            >
              {t.hwAllSubjects} ({initialHomework.length})
            </button>
            {subjectNames.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedSubject === sub
                    ? "bg-navy-800 text-white dark:bg-blue-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.hwSearchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </section>

        {/* Homework Cards */}
        {filtered.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-navy-900">
            <BookMarked className="mx-auto h-11 w-11 text-slate-300 dark:text-slate-700" />
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.hwNoHomework}
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((item) => {
              const isDone = completedIds.includes(item.id);
              const badge = getDueBadge(item.due_date, todayIso, t);

              return (
                <article
                  key={item.id}
                  className={`flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition ${
                    isDone
                      ? "border-emerald-200 bg-emerald-50/40 opacity-85 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-navy-900"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-extrabold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        <BookMarked className="h-3.5 w-3.5" />
                        {item.subject_name}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatShortDate(item.due_date)} • {badge.label}
                      </span>
                    </div>

                    <h2
                      className={`mt-3 text-base font-extrabold text-slate-900 dark:text-white ${
                        isDone ? "line-through opacity-75" : ""
                      }`}
                    >
                      {item.title}
                    </h2>

                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                    {item.link_url ? (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t.hwOpenLink}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {item.created_by ? `Posted by @${item.created_by}` : ""}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleCompleted(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        isDone
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t.hwCompleted}
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" />
                          {t.hwMarkDone}
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

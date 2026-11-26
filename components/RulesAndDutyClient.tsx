"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  Laptop,
  LogIn,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { SessionUser } from "@/types";
import {
  CLASS_RULES_META,
  CLASS_RULE_SECTIONS,
  DUTY_ROSTER_META,
  DUTY_ROSTER_WEEKS,
  getTodayWeekdayName,
} from "@/lib/class-info";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useHideOnMobileScroll } from "@/lib/useHideOnMobileScroll";

interface RulesAndDutyClientProps {
  sessionUser: SessionUser | null;
  initialView?: "all" | "rules" | "duty";
}

const SECTION_ICONS = [
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  Laptop,
];

export function RulesAndDutyClient({
  sessionUser,
  initialView = "all",
}: RulesAndDutyClientProps) {
  const [view, setView] = useState<"all" | "rules" | "duty">(initialView);
  const todayWeekday = useMemo(() => getTodayWeekdayName(), []);
  const hideHeaderOnMobile = useHideOnMobileScroll();

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-navy-950">
      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-navy-900/95 ${
          hideHeaderOnMobile ? "-translate-y-full md:translate-y-0" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-blue-700 text-white shadow sm:flex">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 sm:text-base dark:text-white">
                  MYP 3 Class Rules &amp; Duty Roster
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  International GoldStars School • Leaders: Yahyo &amp; Fazliya
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-navy-950">
              <button
                type="button"
                onClick={() => setView("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  view === "all"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setView("rules")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  view === "rules"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <BookOpenCheck className="h-3.5 w-3.5" />
                Class Rules
              </button>
              <button
                type="button"
                onClick={() => setView("duty")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  view === "duty"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Duty Roster
              </button>
            </div>

            {sessionUser ? (
              <Link
                href={sessionUser.role === "admin" ? "/admin" : "/account"}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
              >
                {sessionUser.role === "admin" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span>@{sessionUser.username}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* SECTION 1: ESSENTIAL CLASSROOM AGREEMENT (CLASS RULES) */}
        {(view === "all" || view === "rules") && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-navy-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 px-6 py-7 text-center text-white sm:px-8">
              <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm">
                <BookOpenCheck className="h-3.5 w-3.5" />
                Class Rules
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {CLASS_RULES_META.title}
              </h2>
              <p className="mt-2 text-xs font-medium text-blue-100/90 sm:text-sm">
                {CLASS_RULES_META.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:p-8 md:grid-cols-2">
              {CLASS_RULE_SECTIONS.map((section, idx) => {
                const Icon = SECTION_ICONS[idx % SECTION_ICONS.length];
                return (
                  <div
                    key={section.number}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-navy-950/70 dark:hover:border-blue-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white shadow-sm dark:bg-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-navy-900 dark:text-white">
                        {section.number}. {section.title}
                      </h3>
                    </div>

                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {section.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-2.5"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                          <span>
                            {item.label ? (
                              <>
                                <strong className="font-bold text-slate-900 dark:text-white">
                                  {item.label}:
                                </strong>{" "}
                                {item.text}
                              </>
                            ) : (
                              item.text
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: CLASS DUTY ROSTER */}
        {(view === "all" || view === "duty") && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-navy-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-900 px-6 py-7 text-center text-white sm:px-8">
              <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-sm">
                <ClipboardList className="h-3.5 w-3.5" />
                Students on Duty
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {DUTY_ROSTER_META.title}
              </h2>
              <p className="mt-2 text-xs font-medium text-slate-200/90 sm:text-sm">
                {DUTY_ROSTER_META.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-amber-200">
                  <Users className="h-3.5 w-3.5" />
                  Class Leaders: {DUTY_ROSTER_META.classLeaders}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-blue-200">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Term / Period: {DUTY_ROSTER_META.termPeriod}
                </span>
                {todayWeekday && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-emerald-200 ring-1 ring-emerald-400/40">
                    Today is {todayWeekday}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              {DUTY_ROSTER_WEEKS.map((week) => {
                const headerBg =
                  week.weekNumber === 1
                    ? "bg-navy-900 dark:bg-navy-800"
                    : "bg-blue-700 dark:bg-blue-800";

                return (
                  <div key={week.weekNumber} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 sm:text-base dark:text-blue-300">
                        {week.title}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                        Monday – Friday
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full min-w-[620px] text-left text-sm">
                        <thead>
                          <tr className={`${headerBg} text-white`}>
                            <th className="w-40 px-4 py-3 text-xs font-extrabold uppercase tracking-wider">
                              Day of the Week
                            </th>
                            <th className="w-56 px-4 py-3 text-xs font-extrabold uppercase tracking-wider">
                              Students on Duty
                            </th>
                            <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider">
                              Core Responsibilities
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {week.rows.map((row) => {
                            const isToday = todayWeekday === row.day;
                            return (
                              <tr
                                key={`${week.weekNumber}-${row.day}`}
                                className={
                                  isToday
                                    ? "bg-emerald-50/80 dark:bg-emerald-950/30"
                                    : "bg-white hover:bg-slate-50/80 dark:bg-navy-900 dark:hover:bg-navy-800/60"
                                }
                              >
                                <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <span>{row.day}</span>
                                    {isToday && (
                                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                        Today
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {row.students.map((student) => (
                                      <span
                                        key={student}
                                        className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-100"
                                      >
                                        {student}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                                  {row.responsibilities}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

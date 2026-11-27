"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarX2,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { AbsenceReport, SessionUser } from "@/types";
import {
  formatShortDate,
  formatTimestampRelative,
  getTodayDateISO,
} from "@/lib/calculations";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { useHideOnMobileScroll } from "@/lib/useHideOnMobileScroll";

interface AbsencePageClientProps {
  sessionUser: SessionUser | null;
  initialAbsences: AbsenceReport[];
}

const REASON_PRESETS = [
  "Sick / Feeling unwell",
  "Doctor / Medical appointment",
  "Family reason",
  "School competition / Official event",
  "Travel / Out of town",
];

function getTomorrowDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AbsencePageClient({
  sessionUser,
  initialAbsences,
}: AbsencePageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const hideHeaderOnMobile = useHideOnMobileScroll();
  const todayIso = getTodayDateISO();
  const tomorrowIso = getTomorrowDateISO();

  const [absences, setAbsences] = useState<AbsenceReport[]>(initialAbsences);
  const [absenceDate, setAbsenceDate] = useState<string>(todayIso);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (reason.trim().length < 3) {
      setErrorMsg("Please explain why you cannot attend school (at least 3 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          absenceDate,
          reason: reason.trim(),
        }),
      });

      const data = (await res.json()) as {
        absence?: AbsenceReport;
        error?: string;
      };

      if (!res.ok || !data.absence) {
        setErrorMsg(data.error ?? "Failed to submit absence report.");
        return;
      }

      setAbsences((prev) => [data.absence!, ...prev]);
      setReason("");
      setSuccessMsg(
        `Your absence notice for ${formatShortDate(data.absence.absence_date)} has been sent to the class admin.`
      );
      router.refresh();
    } catch {
      setErrorMsg("Network error while sending absence report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-navy-950">
      <header
        className={`sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-navy-900/95 ${
          hideHeaderOnMobile ? "-translate-y-full md:translate-y-0" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
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
                {t.absenceHeaderTitle}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.absenceHeaderSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionUser ? (
              <>
                {sessionUser.role === "admin" && (
                  <Link
                    href="/admin?tab=absences"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    View All in Admin
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-700 dark:bg-blue-600"
              >
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </Link>
            )}
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        {!sessionUser ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-navy-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <CalendarX2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
              Log in to Report an Absence
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              If you cannot attend school today or tomorrow, please sign in with
              your student account so the class admin knows who is absent and
              why.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <LogIn className="h-4 w-4" />
                Log In Now
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-navy-800"
              >
                Return to Hub
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Absence Submission Form */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="border-b border-slate-100 bg-gradient-to-r from-rose-600 to-orange-600 px-6 py-5 text-white dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <CalendarX2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold">
                      I Can&apos;t Attend School
                    </h2>
                    <p className="text-xs text-rose-100">
                      Reporting as <strong>@{sessionUser.username}</strong> •
                      Sent directly to the Class Admin
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Date Picker + Quick Buttons */}
                <div>
                  <label
                    htmlFor="absence-date"
                    className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Date You Will Miss School
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAbsenceDate(todayIso)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                        absenceDate === todayIso
                          ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-950 dark:text-slate-300"
                      }`}
                    >
                      Today ({formatShortDate(todayIso)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbsenceDate(tomorrowIso)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                        absenceDate === tomorrowIso
                          ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-950 dark:text-slate-300"
                      }`}
                    >
                      Tomorrow ({formatShortDate(tomorrowIso)})
                    </button>
                    <input
                      id="absence-date"
                      type="date"
                      required
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quick Reason Chips */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Quick Select Reason (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REASON_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReason(preset)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          reason === preset
                            ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-950 dark:text-slate-300"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Textarea */}
                <div>
                  <label
                    htmlFor="absence-reason"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Reason for Absence (Required)
                  </label>
                  <textarea
                    id="absence-reason"
                    rows={3}
                    required
                    minLength={3}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Write why you cannot come to school (e.g. I have a fever and will stay home to rest)..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting || reason.trim().length < 3}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-rose-500 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Notify Admin I Won&apos;t Attend
                  </button>
                </div>
              </form>
            </section>

            {/* Student's Own Submitted History */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    My Submitted Absence Reports
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track when the class admin has seen your notice
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                  {absences.length} total
                </span>
              </div>

              {absences.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  You have not submitted any absence reports yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {absences.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-navy-950/60"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-navy-800 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-blue-600">
                            <Calendar className="h-3 w-3" />
                            {formatShortDate(item.absence_date)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            Sent {formatTimestampRelative(item.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.reason}
                        </p>
                        {item.admin_note && (
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                            Admin note: {item.admin_note}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {item.status === "acknowledged" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Seen by Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            Sent to Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

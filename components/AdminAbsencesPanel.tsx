"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  CalendarX2,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { AbsenceReport } from "@/types";
import {
  formatShortDate,
  formatTimestampRelative,
  getTodayDateISO,
} from "@/lib/calculations";
import { useLanguage } from "@/components/LanguageProvider";

interface AdminAbsencesPanelProps {
  absences: AbsenceReport[];
  onAbsencesChange: (next: AbsenceReport[]) => void;
  onNotify: (msg: {
    title: string;
    subtitle?: string;
    variant: "success" | "warning" | "error";
  }) => void;
}

export function AdminAbsencesPanel({
  absences,
  onAbsencesChange,
  onNotify,
}: AdminAbsencesPanelProps) {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "acknowledged"
  >("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const todayIso = getTodayDateISO();

  const pendingCount = useMemo(
    () => absences.filter((a) => a.status === "pending").length,
    [absences]
  );

  const todayCount = useMemo(
    () => absences.filter((a) => a.absence_date === todayIso).length,
    [absences, todayIso]
  );

  const filtered = useMemo(() => {
    if (filterStatus === "all") return absences;
    return absences.filter((a) => a.status === filterStatus);
  }, [absences, filterStatus]);

  const handleToggleStatus = async (report: AbsenceReport) => {
    setBusyId(report.id);
    const nextStatus =
      report.status === "acknowledged" ? "pending" : "acknowledged";

    try {
      const res = await fetch("/api/admin/absences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, status: nextStatus }),
      });

      const data = (await res.json()) as {
        absence?: AbsenceReport;
        error?: string;
      };

      if (!res.ok || !data.absence) {
        onNotify({
          title: "Could not update status",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      onAbsencesChange(
        absences.map((a) => (a.id === report.id ? data.absence! : a))
      );
      onNotify({
        title:
          nextStatus === "acknowledged"
            ? `Marked ${report.username}'s absence as Seen`
            : `Marked ${report.username}'s absence as Pending`,
        variant: "success",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (report: AbsenceReport) => {
    if (!window.confirm(`Delete absence report from @${report.username}?`)) {
      return;
    }
    setBusyId(report.id);
    try {
      const res = await fetch(
        `/api/admin/absences?id=${encodeURIComponent(report.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        onNotify({
          title: "Could not delete report",
          variant: "error",
        });
        return;
      }
      onAbsencesChange(absences.filter((a) => a.id !== report.id));
      onNotify({
        title: `Deleted absence report from @${report.username}`,
        variant: "warning",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <CalendarX2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {t.adminAbsTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.adminAbsSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              {t.adminAbsToday} {todayCount}
            </span>
            <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {t.adminAbsUnseen} {pendingCount}
            </span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-navy-950">
              {(["all", "pending", "acknowledged"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterStatus(tab)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    filterStatus === tab
                      ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  {tab === "acknowledged"
                    ? t.adminAbsSeen
                    : tab === "pending"
                    ? t.adminAbsPending
                    : t.adminAbsAll}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reports List */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarX2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.adminAbsEmpty}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.adminAbsEmptySub}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => {
              const isToday = report.absence_date === todayIso;
              const isBusy = busyId === report.id;

              return (
                <div
                  key={report.id}
                  className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                    report.status === "pending"
                      ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-navy-950/60"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        @{report.username}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                          isToday
                            ? "bg-rose-600 text-white"
                            : "bg-navy-800 text-white dark:bg-blue-600"
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatShortDate(report.absence_date)}
                        {isToday ? " (Today)" : ""}
                      </span>
                      {report.status === "acknowledged" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Seen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          New / Unseen
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • {formatTimestampRelative(report.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      <strong className="font-bold text-slate-900 dark:text-white">
                        Reason:
                      </strong>{" "}
                      {report.reason}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStatus(report)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                        report.status === "acknowledged"
                          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
                          : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
                      }`}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {report.status === "acknowledged"
                        ? t.adminAbsMarkUnseen
                        : t.adminAbsMarkSeen}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(report)}
                      title="Delete absence report"
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

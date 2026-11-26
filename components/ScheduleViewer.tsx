"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Image as ImageIcon,
  Maximize2,
  Plus,
  X,
} from "lucide-react";
import { ClassSchedule, SessionUser } from "@/types";
import { DAYS_OF_WEEK, getCurrentDayOfWeek } from "@/lib/calculations";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ScheduleViewerProps {
  schedules: ClassSchedule[];
  sessionUser?: SessionUser | null;
  standalone?: boolean;
}

export function ScheduleViewer({
  schedules,
  sessionUser = null,
  standalone = false,
}: ScheduleViewerProps) {
  const activeDefault = useMemo(
    () => schedules.find((s) => s.is_active) ?? schedules[0] ?? null,
    [schedules]
  );

  const [selectedId, setSelectedId] = useState<string>(activeDefault?.id ?? "");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const currentSchedule = useMemo(
    () => schedules.find((s) => s.id === selectedId) ?? activeDefault,
    [schedules, selectedId, activeDefault]
  );

  const todayDay = useMemo(() => getCurrentDayOfWeek(), []);

  const content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              MYP 3 Class Schedule
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official lesson timetable &amp; uploaded schedule photos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {schedules.length > 1 && (
            <select
              aria-label="Select schedule"
              value={currentSchedule?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-navy-800 dark:text-white"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.is_active ? "(Active)" : ""}
                </option>
              ))}
            </select>
          )}

          {sessionUser?.role === "admin" && (
            <Link
              href="/admin?tab=schedules"
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add / Edit Schedule
            </Link>
          )}
        </div>
      </div>

      {!currentSchedule ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-slate-800 dark:bg-navy-950/50">
          <ImageIcon className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            No Class Schedule Added Yet
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Class Leader Admin can upload a schedule photo or add daily lessons in the Admin Console.
          </p>
          {sessionUser?.role === "admin" && (
            <Link
              href="/admin?tab=schedules"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Upload Schedule Now
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Uploaded Schedule Photo (if present) */}
          {currentSchedule.image_url && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-navy-950/60">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                  {currentSchedule.title}
                </span>
                <button
                  type="button"
                  onClick={() => setZoomImage(currentSchedule.image_url)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Full Size
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSchedule.image_url}
                alt={currentSchedule.title}
                onClick={() => setZoomImage(currentSchedule.image_url)}
                className="mx-auto max-h-[680px] w-auto cursor-zoom-in rounded-xl object-contain shadow-sm"
              />
            </div>
          )}

          {/* Structured Daily Timetable Grid (if entries exist) */}
          {currentSchedule.entries.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayLessons = currentSchedule.entries
                  .filter((e) => e.day === day)
                  .sort((a, b) => a.period - b.period);

                if (dayLessons.length === 0) return null;
                const isToday = day === todayDay;

                return (
                  <div
                    key={day}
                    className={`rounded-2xl border p-4 transition ${
                      isToday
                        ? "border-blue-400 bg-blue-50/40 shadow-sm dark:border-blue-500/60 dark:bg-blue-950/20"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-navy-950/60"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {day}
                      </h3>
                      {isToday && (
                        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {dayLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-navy-900"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-navy-800 text-[11px] font-bold text-white dark:bg-blue-600">
                              {lesson.period}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {lesson.subject}
                              </p>
                              {lesson.roomOrTeacher && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {lesson.roomOrTeacher}
                                </p>
                              )}
                            </div>
                          </div>
                          {lesson.time && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              {lesson.time}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox for Schedule Photo */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="fixed right-5 top-5 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage}
            alt="Full-size class schedule"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );

  if (!standalone) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-navy-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Activity Hub
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-navy-900">
          {content}
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  BookMarked,
  Calendar,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { HomeworkAssignment, Subject } from "@/types";
import { formatShortDate, getTodayDateISO } from "@/lib/calculations";
import { useLanguage } from "@/components/LanguageProvider";

interface AdminHomeworkPanelProps {
  homework: HomeworkAssignment[];
  subjects: Subject[];
  onHomeworkChange: (next: HomeworkAssignment[]) => void;
  onNotify: (msg: {
    title: string;
    subtitle?: string;
    variant: "success" | "warning" | "error";
  }) => void;
}

function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminHomeworkPanel({
  homework,
  subjects,
  onHomeworkChange,
  onNotify,
}: AdminHomeworkPanelProps) {
  const { t } = useLanguage();
  const visibleSubjects = subjects.filter((s) => !s.is_hidden && !s.is_duty_category);

  const [subjectName, setSubjectName] = useState<string>(
    () => visibleSubjects[0]?.name ?? "Mathematics"
  );
  const [customSubject, setCustomSubject] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(() => getDefaultDueDate());
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubject =
      subjectName === "__custom__" ? customSubject.trim() : subjectName;

    if (!effectiveSubject || !title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: effectiveSubject,
          title: title.trim(),
          description: description.trim(),
          dueDate,
          linkUrl: linkUrl.trim() || undefined,
        }),
      });

      const data = (await res.json()) as {
        homework?: HomeworkAssignment;
        error?: string;
      };

      if (!res.ok || !data.homework) {
        onNotify({
          title: "Could not post homework",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      onHomeworkChange([data.homework, ...homework]);
      setTitle("");
      setDescription("");
      setLinkUrl("");
      onNotify({
        title: `Homework posted for ${data.homework.subject_name}`,
        subtitle: data.homework.title,
        variant: "success",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: HomeworkAssignment) => {
    if (!window.confirm(`Delete homework "${item.title}"?`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(
        `/api/admin/homework?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        onNotify({ title: "Could not delete homework", variant: "error" });
        return;
      }
      onHomeworkChange(homework.filter((h) => h.id !== item.id));
      onNotify({
        title: `Removed homework "${item.title}"`,
        variant: "warning",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Homework Form */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {t.hwManageTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.hwManageSubtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.hwSubjectLabel}
              </label>
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              >
                {visibleSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="__custom__">+ Custom Subject...</option>
              </select>
              {subjectName === "__custom__" && (
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter subject name..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.hwTitleLabel}
              </label>
              <input
                type="text"
                required
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Workbook p. 42–43, Ex. 1–5"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.hwDueDateLabel}
              </label>
              <input
                type="date"
                required
                min={getTodayDateISO()}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.hwDescLabel}
            </label>
            <textarea
              rows={3}
              required
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write clear instructions for students..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.hwLinkLabel}
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://classroom.google.com/..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy-800 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t.hwPublishBtn}
            </button>
          </div>
        </form>
      </section>

      {/* Posted Homework List */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Posted Assignments ({homework.length})
        </h3>

        {homework.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.hwNoHomework}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {homework.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-navy-950/60"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-indigo-100 px-2.5 py-0.5 text-xs font-extrabold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {item.subject_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-navy-800 dark:text-slate-300">
                      <Calendar className="h-3 w-3" />
                      Due {formatShortDate(item.due_date)}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {item.link_url}
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                  title="Delete homework"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

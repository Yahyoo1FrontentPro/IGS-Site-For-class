"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCheck,
  ClipboardCheck,
  Clock,
  Loader2,
  Plus,
  Save,
  Trash2,
  UserX,
} from "lucide-react";
import {
  AbsenceReport,
  LessonIncident,
  LessonIncidentType,
  RollCallEntry,
  RollCallStatus,
  Student,
  Subject,
} from "@/types";
import { formatShortDate, getTodayDateISO } from "@/lib/calculations";
import { useLanguage } from "@/components/LanguageProvider";

interface AdminRollCallAndLogsPanelProps {
  students: Student[];
  subjects: Subject[];
  absences: AbsenceReport[];
  rollCalls: RollCallEntry[];
  onRollCallsChange: (next: RollCallEntry[]) => void;
  incidents: LessonIncident[];
  onIncidentsChange: (next: LessonIncident[]) => void;
  onNotify: (msg: {
    title: string;
    subtitle?: string;
    variant: "success" | "warning" | "error";
  }) => void;
}

export function AdminRollCallAndLogsPanel({
  students,
  subjects,
  absences,
  rollCalls,
  onRollCallsChange,
  incidents,
  onIncidentsChange,
  onNotify,
}: AdminRollCallAndLogsPanelProps) {
  const { t } = useLanguage();
  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => s.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const visibleSubjects = useMemo(
    () => subjects.filter((s) => !s.is_hidden && !s.is_duty_category),
    [subjects]
  );

  // ---- PART A: ROLL-CALL STATE ----
  const [rollDate, setRollDate] = useState<string>(() => getTodayDateISO());
  const [statusMap, setStatusMap] = useState<Record<string, RollCallStatus>>({});
  const [savingRollCall, setSavingRollCall] = useState<boolean>(false);

  // Sync statusMap whenever rollDate or rollCalls changes
  useEffect(() => {
    const existingForDate = rollCalls.filter((r) => r.roll_date === rollDate);
    const nextMap: Record<string, RollCallStatus> = {};
    for (const st of activeStudents) {
      const match = existingForDate.find((r) => r.student_id === st.id);
      if (match) {
        nextMap[st.id] = match.status;
      } else {
        // Pre-fill 'excused' if student submitted a self-reported absence for this date
        const reported = absences.find(
          (a) =>
            a.absence_date === rollDate &&
            a.username.toLowerCase() === st.name.toLowerCase()
        );
        nextMap[st.id] = reported ? "excused" : "present";
      }
    }
    setStatusMap(nextMap);
  }, [rollDate, rollCalls, activeStudents, absences]);

  const rollCallSummaryByDate = useMemo(() => {
    const map = new Map<
      string,
      { present: number; late: number; absent: number; excused: number }
    >();
    for (const r of rollCalls) {
      const curr = map.get(r.roll_date) ?? {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      };
      curr[r.status] += 1;
      map.set(r.roll_date, curr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10);
  }, [rollCalls]);

  const currentCounts = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, excused: 0 };
    for (const st of activeStudents) {
      const s = statusMap[st.id] ?? "present";
      counts[s] += 1;
    }
    return counts;
  }, [activeStudents, statusMap]);

  const handleMarkAllPresent = () => {
    const next: Record<string, RollCallStatus> = {};
    for (const st of activeStudents) {
      next[st.id] = "present";
    }
    setStatusMap(next);
  };

  const handleSaveRollCall = async () => {
    setSavingRollCall(true);
    try {
      const entries = activeStudents.map((st) => ({
        studentId: st.id,
        studentName: st.name,
        status: statusMap[st.id] ?? "present",
      }));

      const res = await fetch("/api/admin/roll-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollDate, entries }),
      });

      const data = (await res.json()) as {
        entries?: RollCallEntry[];
        error?: string;
      };

      if (!res.ok || !data.entries) {
        onNotify({
          title: "Could not save roll-call",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      const others = rollCalls.filter((r) => r.roll_date !== rollDate);
      onRollCallsChange([...data.entries, ...others]);
      onNotify({
        title: `Roll-call saved for ${formatShortDate(rollDate)}`,
        subtitle: `${currentCounts.present} Present • ${currentCounts.late} Late • ${currentCounts.absent} Absent • ${currentCounts.excused} Excused`,
        variant: "success",
      });
    } finally {
      setSavingRollCall(false);
    }
  };

  // ---- PART B: TEACHER NO-SHOW & CANCELLED CLASSES LOG ----
  const [incidentType, setIncidentType] =
    useState<LessonIncidentType>("teacher_noshow");
  const [incidentDate, setIncidentDate] = useState<string>(() =>
    getTodayDateISO()
  );
  const [incidentSubject, setIncidentSubject] = useState<string>(
    () => visibleSubjects[0]?.name ?? "Mathematics"
  );
  const [customSubject, setCustomSubject] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("");
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [incidentNotes, setIncidentNotes] = useState<string>("");
  const [savingIncident, setSavingIncident] = useState<boolean>(false);
  const [incidentFilter, setIncidentFilter] = useState<
    "all" | LessonIncidentType
  >("all");
  const [deletingIncidentId, setDeletingIncidentId] = useState<string | null>(
    null
  );

  const filteredIncidents = useMemo(() => {
    if (incidentFilter === "all") return incidents;
    return incidents.filter((i) => i.incident_type === incidentFilter);
  }, [incidents, incidentFilter]);

  const teacherNoShowCount = useMemo(
    () => incidents.filter((i) => i.incident_type === "teacher_noshow").length,
    [incidents]
  );

  const cancelledCount = useMemo(
    () => incidents.filter((i) => i.incident_type === "class_cancelled").length,
    [incidents]
  );

  const handleRecordIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubject =
      incidentSubject === "__custom__"
        ? customSubject.trim()
        : incidentSubject;

    if (!effectiveSubject) return;

    setSavingIncident(true);
    try {
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentDate,
          incidentType,
          subjectName: effectiveSubject,
          teacherName: teacherName.trim() || undefined,
          periodLabel: periodLabel.trim() || undefined,
          notes: incidentNotes.trim() || undefined,
        }),
      });

      const data = (await res.json()) as {
        incident?: LessonIncident;
        error?: string;
      };

      if (!res.ok || !data.incident) {
        onNotify({
          title: "Could not record event",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      onIncidentsChange([data.incident, ...incidents]);
      setTeacherName("");
      setPeriodLabel("");
      setIncidentNotes("");
      onNotify({
        title:
          data.incident.incident_type === "teacher_noshow"
            ? `Recorded Teacher No-Show (${data.incident.subject_name})`
            : `Recorded Cancelled Class (${data.incident.subject_name})`,
        subtitle: formatShortDate(data.incident.incident_date),
        variant: "success",
      });
    } finally {
      setSavingIncident(false);
    }
  };

  const handleDeleteIncident = async (item: LessonIncident) => {
    if (!window.confirm(`Delete this log entry for ${item.subject_name}?`)) {
      return;
    }
    setDeletingIncidentId(item.id);
    try {
      const res = await fetch(
        `/api/admin/incidents?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        onNotify({ title: "Could not delete record", variant: "error" });
        return;
      }
      onIncidentsChange(incidents.filter((i) => i.id !== item.id));
      onNotify({ title: "Deleted incident record", variant: "warning" });
    } finally {
      setDeletingIncidentId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: DAILY ROLL-CALL */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {t.rcTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.rcSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={rollDate}
              onChange={(e) => setRollDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t.rcMarkAllPresent}
            </button>
            <button
              type="button"
              disabled={savingRollCall}
              onClick={handleSaveRollCall}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-4 py-2 text-xs font-bold text-white shadow hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {savingRollCall ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {t.rcSaveBtn}
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {t.rcPresent}: {currentCounts.present}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t.rcLate}: {currentCounts.late}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            {t.rcAbsent}: {currentCounts.absent}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {t.rcExcused}: {currentCounts.excused}
          </span>
        </div>

        {/* Student Roll-Call Grid */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {activeStudents.map((st) => {
            const stStatus = statusMap[st.id] ?? "present";
            const selfAbsence = absences.find(
              (a) =>
                a.absence_date === rollDate &&
                a.username.toLowerCase() === st.name.toLowerCase()
            );

            return (
              <div
                key={st.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-navy-950/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {st.name}
                  </span>
                  {selfAbsence && (
                    <span
                      title={`Self-reported absence: ${selfAbsence.reason}`}
                      className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    >
                      Reported Absent
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      { key: "present", label: t.rcPresent, active: "bg-emerald-600 text-white" },
                      { key: "late", label: t.rcLate, active: "bg-amber-500 text-white" },
                      { key: "absent", label: t.rcAbsent, active: "bg-rose-600 text-white" },
                      { key: "excused", label: t.rcExcused, active: "bg-blue-600 text-white" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setStatusMap((prev) => ({ ...prev, [st.id]: opt.key }))
                      }
                      className={`rounded-lg px-1.5 py-1.5 text-[10px] font-bold transition ${
                        stStatus === opt.key
                          ? opt.active
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Past Roll-Call Dates History */}
        {rollCallSummaryByDate.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.rcSavedDates}
            </p>
            <div className="flex flex-wrap gap-2">
              {rollCallSummaryByDate.map(([dateStr, counts]) => (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setRollDate(dateStr)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    rollDate === dateStr
                      ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-950 dark:text-slate-300"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatShortDate(dateStr)}</span>
                  <span className="text-[10px] opacity-80">
                    ({counts.present}P / {counts.late}L / {counts.absent}A / {counts.excused}E)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: TEACHER NO-SHOW & CANCELLED CLASSES LOG */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {t.incTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.incSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {t.incTypeTeacher}: {teacherNoShowCount}
            </span>
            <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              {t.incTypeCancelled}: {cancelledCount}
            </span>
          </div>
        </div>

        {/* Record Incident Form */}
        <form
          onSubmit={handleRecordIncident}
          className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-800 dark:bg-navy-950/60"
        >
          {/* Incident Type Toggle */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIncidentType("teacher_noshow")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                incidentType === "teacher_noshow"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-300"
              }`}
            >
              <UserX className="h-4 w-4" />
              {t.incTypeTeacher}
            </button>
            <button
              type="button"
              onClick={() => setIncidentType("class_cancelled")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                incidentType === "class_cancelled"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-300"
              }`}
            >
              <Ban className="h-4 w-4" />
              {t.incTypeCancelled}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.incDateLabel}
              </label>
              <input
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.incSubjectLabel}
              </label>
              <select
                value={incidentSubject}
                onChange={(e) => setIncidentSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
              >
                {visibleSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="__custom__">+ Custom Subject...</option>
              </select>
              {incidentSubject === "__custom__" && (
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.incTeacherLabel}
              </label>
              <input
                type="text"
                maxLength={100}
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Mr. / Ms. ..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.incPeriodLabel}
              </label>
              <input
                type="text"
                maxLength={60}
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. Period 3 (10:15)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.incNotesLabel}
              </label>
              <input
                type="text"
                maxLength={500}
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                placeholder="e.g. Waited 20 minutes, no substitute arrived / School assembly..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={savingIncident}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy-800 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {savingIncident ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t.incRecordBtn}
            </button>
          </div>
        </form>

        {/* History Filter & List */}
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t.incHistoryTitle} ({filteredIncidents.length})
            </h3>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-navy-950">
              {(
                [
                  { id: "all", label: t.incFilterAll },
                  { id: "teacher_noshow", label: t.incTypeTeacher },
                  { id: "class_cancelled", label: t.incTypeCancelled },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setIncidentFilter(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    incidentFilter === tab.id
                      ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredIncidents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.incEmpty}
            </p>
          ) : (
            <div className="space-y-2.5">
              {filteredIncidents.map((inc) => {
                const isTeacher = inc.incident_type === "teacher_noshow";
                return (
                  <div
                    key={inc.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-navy-950/60"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isTeacher
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {isTeacher ? (
                            <UserX className="h-3 w-3" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}
                          {isTeacher ? t.incTypeTeacher : t.incTypeCancelled}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-navy-800 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-blue-600">
                          <Calendar className="h-3 w-3" />
                          {formatShortDate(inc.incident_date)}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {inc.subject_name}
                        </span>
                        {inc.teacher_name && (
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            • {inc.teacher_name}
                          </span>
                        )}
                        {inc.period_label && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            {inc.period_label}
                          </span>
                        )}
                      </div>
                      {inc.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {inc.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={deletingIncidentId === inc.id}
                      onClick={() => handleDeleteIncident(inc)}
                      title="Delete record"
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

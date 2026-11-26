"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarX2,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  Undo2,
  UserPlus,
  Users,
  Vote,
  X,
  Zap,
} from "lucide-react";
import {
  AbsenceReport,
  AppUserSummary,
  ClassSchedule,
  DayOfWeek,
  ElectionState,
  HubDataset,
  PointCategory,
  PointLog,
  ScheduleLesson,
  SessionUser,
  Student,
  Subject,
  Week,
} from "@/types";
import { DAYS_OF_WEEK, formatShortDate, getTodayDateISO } from "@/lib/calculations";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminElectionPanel } from "@/components/AdminElectionPanel";
import { AdminAbsencesPanel } from "@/components/AdminAbsencesPanel";
import { AdminRolesPanel } from "@/components/AdminRolesPanel";
import { useHideOnMobileScroll } from "@/lib/useHideOnMobileScroll";

type AdminTab = "daily" | "schedules" | "voting" | "absences" | "manage";

interface AdminPanelClientProps {
  initialDataset: HubDataset;
  currentUser: SessionUser;
  initialAppUsers?: AppUserSummary[];
  initialTab?: AdminTab;
  initialElection: ElectionState;
  initialAbsences?: AbsenceReport[];
}

interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  variant: "success" | "warning" | "error";
  undoLogId?: string;
}

const FAIR_PLAY_PRESETS = [
  "Disrupting class discussion",
  "Talking over teacher or peer",
  "Off-task device usage",
  "Unprepared materials / late to seat",
  "Unsportsmanlike comment",
];

/**
 * Compresses any uploaded camera/screenshot photo in the browser to <= 1600px JPEG
 * so even 10MB phone photos upload instantly and reliably to Supabase & Render.
 */
function compressScheduleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image format."));
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function AdminPanelClient({
  initialDataset,
  currentUser,
  initialAppUsers = [],
  initialTab = "daily",
  initialElection,
  initialAbsences = [],
}: AdminPanelClientProps) {
  const router = useRouter();
  const hideHeaderOnMobile = useHideOnMobileScroll();

  const [appUsers, setAppUsers] = useState<AppUserSummary[]>(initialAppUsers);
  const [absences, setAbsences] = useState<AbsenceReport[]>(initialAbsences);
  const pendingAbsencesCount = useMemo(
    () => absences.filter((a) => a.status === "pending").length,
    [absences]
  );
  const [myPhoneInput, setMyPhoneInput] = useState<string>(
    currentUser.phone ?? ""
  );
  const [savingPhone, setSavingPhone] = useState(false);

  const [students, setStudents] = useState<Student[]>(initialDataset.students);
  const [subjects, setSubjects] = useState<Subject[]>(initialDataset.subjects);
  const [weeks, setWeeks] = useState<Week[]>(initialDataset.weeks);
  const [pointLogs, setPointLogs] = useState<PointLog[]>(
    initialDataset.pointLogs
  );
  const [schedules, setSchedules] = useState<ClassSchedule[]>(
    initialDataset.schedules
  );

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const activeWeek = useMemo(
    () => weeks.find((w) => w.is_active) ?? weeks[weeks.length - 1],
    [weeks]
  );

  const visibleSubjects = useMemo(
    () => subjects.filter((s) => !s.is_hidden),
    [subjects]
  );

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayDateISO()
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => visibleSubjects[0]?.id ?? subjects[0]?.id ?? ""
  );
  const [studentSearch, setStudentSearch] = useState<string>("");

  const [busyStudentKey, setBusyStudentKey] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fair-Play Modal State
  const [fairPlayTarget, setFairPlayTarget] = useState<Student | null>(null);
  const [fairPlayReason, setFairPlayReason] = useState<string>("");
  const [submittingFairPlay, setSubmittingFairPlay] = useState<boolean>(false);

  // Schedule Builder State
  const [scheduleTitle, setScheduleTitle] = useState<string>(
    "MYP 3 Class Schedule"
  );
  const [scheduleImagePreview, setScheduleImagePreview] = useState<
    string | null
  >(null);
  const [draftLessons, setDraftLessons] = useState<ScheduleLesson[]>([]);
  const [lessonDay, setLessonDay] = useState<DayOfWeek>("Monday");
  const [lessonPeriod, setLessonPeriod] = useState<number>(1);
  const [lessonTime, setLessonTime] = useState<string>("08:30 - 09:15");
  const [lessonSubject, setLessonSubject] = useState<string>("");
  const [lessonRoom, setLessonRoom] = useState<string>("");
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  // Management — Weeks
  const nextWeekNum = useMemo(
    () => Math.max(0, ...weeks.map((w) => w.week_number)) + 1,
    [weeks]
  );
  const [newWeekName, setNewWeekName] = useState<string>("");
  const [newWeekStart, setNewWeekStart] = useState<string>(() =>
    getTodayDateISO()
  );
  const [newWeekEnd, setNewWeekEnd] = useState<string>(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 6);
    return dt.toISOString().slice(0, 10);
  });
  const [creatingWeek, setCreatingWeek] = useState(false);

  // Management — Solo Students
  const [newStudentName, setNewStudentName] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");

  // Management — Subjects
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectAward, setNewSubjectAward] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  // Management — Clear Data Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [clearingData, setClearingData] = useState(false);

  const pushToast = (toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const studentStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { todayPoints: number; scoredPositiveToday: boolean; weekPoints: number }
    >();
    for (const s of students) {
      map.set(s.id, {
        todayPoints: 0,
        scoredPositiveToday: false,
        weekPoints: 0,
      });
    }
    for (const log of pointLogs) {
      const entry = map.get(log.student_id);
      if (!entry) continue;
      if (log.date === selectedDate) {
        entry.todayPoints += log.points;
        if (log.points > 0) entry.scoredPositiveToday = true;
      }
      if (activeWeek && log.week_id === activeWeek.id) {
        entry.weekPoints += log.points;
      }
    }
    return map;
  }, [students, pointLogs, selectedDate, activeWeek]);

  const filteredActiveStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students
      .filter(
        (s) => s.is_active && (q.length === 0 || s.name.toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, studentSearch]);

  const handleAwardPoint = async (
    student: Student,
    category: PointCategory,
    reason?: string
  ) => {
    if (!activeWeek) {
      pushToast({
        title: "No Active Week",
        subtitle: "Please create or activate a week in Management first.",
        variant: "error",
      });
      return;
    }

    if (!selectedSubjectId) {
      pushToast({
        title: "Select a Subject",
        subtitle: "Choose a lesson/subject at the top first.",
        variant: "error",
      });
      return;
    }

    const actionKey = `${student.id}-${category}`;
    setBusyStudentKey(actionKey);

    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          subjectId: selectedSubjectId,
          weekId: activeWeek.id,
          date: selectedDate,
          category,
          reason,
        }),
      });

      const data = (await res.json()) as {
        pointLog?: PointLog;
        error?: string;
      };

      if (!res.ok || !data.pointLog) {
        pushToast({
          title: "Could not save points",
          subtitle: data.error ?? "Database error.",
          variant: "error",
        });
        return;
      }

      const createdLog = data.pointLog;
      setPointLogs((prev) => [createdLog, ...prev]);

      const subjectObj = subjects.find((s) => s.id === createdLog.subject_id);
      const ptsLabel =
        createdLog.points > 0 ? `+${createdLog.points}` : `${createdLog.points}`;

      pushToast({
        title: `${ptsLabel} ${category} → ${student.name}`,
        subtitle: `${subjectObj?.name ?? "Subject"} • ${formatShortDate(
          selectedDate
        )}`,
        variant: createdLog.points < 0 ? "warning" : "success",
        undoLogId: createdLog.id,
      });

      router.refresh();
    } catch {
      pushToast({
        title: "Network Error",
        subtitle: "Failed to reach server.",
        variant: "error",
      });
    } finally {
      setBusyStudentKey(null);
    }
  };

  const handleUndo = async (logId: string, toastId: string) => {
    dismissToast(toastId);
    try {
      const res = await fetch(
        `/api/admin/points?id=${encodeURIComponent(logId)}`,
        {
          method: "DELETE",
        }
      );
      const data = (await res.json()) as { undone?: boolean; error?: string };

      if (!res.ok || !data.undone) {
        pushToast({
          title: "Undo failed",
          subtitle: data.error ?? "Could not undo entry.",
          variant: "error",
        });
        return;
      }

      setPointLogs((prev) => prev.filter((l) => l.id !== logId));
      pushToast({
        title: "Action Undone",
        subtitle: "Point log removed.",
        variant: "warning",
      });
      router.refresh();
    } catch {
      pushToast({ title: "Network error during Undo", variant: "error" });
    }
  };

  const submitFairPlayModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fairPlayTarget || fairPlayReason.trim().length < 3) return;
    setSubmittingFairPlay(true);
    await handleAwardPoint(fairPlayTarget, "Fair-Play", fairPlayReason.trim());
    setSubmittingFairPlay(false);
    setFairPlayTarget(null);
    setFairPlayReason("");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  // Schedule Handlers
  const handleSchedulePhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressScheduleImage(file);
      setScheduleImagePreview(compressed);
    } catch {
      pushToast({
        title: "Could not read image",
        subtitle: "Please choose a valid PNG, JPG, or WebP photo.",
        variant: "error",
      });
    }
  };

  const handleAddDraftLesson = () => {
    if (!lessonSubject.trim()) return;
    const item: ScheduleLesson = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day: lessonDay,
      period: lessonPeriod,
      time: lessonTime.trim(),
      subject: lessonSubject.trim(),
      roomOrTeacher: lessonRoom.trim() || undefined,
    };
    setDraftLessons((prev) => [...prev, item]);
    setLessonPeriod((p) => p + 1);
    setLessonSubject("");
    setLessonRoom("");
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleImagePreview && draftLessons.length === 0) {
      pushToast({
        title: "Upload a Photo or Add Lessons",
        subtitle:
          "Select a schedule photo or add at least one lesson row before saving.",
        variant: "error",
      });
      return;
    }

    setSavingSchedule(true);
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle.trim() || "MYP 3 Class Schedule",
          imageUrl: scheduleImagePreview,
          entries: draftLessons,
          makeActive: true,
        }),
      });
      const data = (await res.json()) as {
        schedule?: ClassSchedule;
        error?: string;
      };
      if (!res.ok || !data.schedule) {
        pushToast({
          title: "Failed to save schedule",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      setSchedules((prev) => [
        data.schedule!,
        ...prev.map((s) => ({ ...s, is_active: false })),
      ]);
      setScheduleImagePreview(null);
      setDraftLessons([]);
      pushToast({
        title: "New Schedule Published!",
        subtitle: "Live now on Public Dashboard, /schedule, and TV Mode.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleActivateSchedule = async (scheduleId: string) => {
    const res = await fetch("/api/admin/schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, makeActive: true }),
    });
    const data = (await res.json()) as {
      schedule?: ClassSchedule;
      error?: string;
    };
    if (!res.ok || !data.schedule) {
      pushToast({
        title: "Could not activate schedule",
        subtitle: data.error,
        variant: "error",
      });
      return;
    }
    setSchedules((prev) =>
      prev.map((s) => ({ ...s, is_active: s.id === scheduleId }))
    );
    pushToast({
      title: `Active Schedule: ${data.schedule.title}`,
      variant: "success",
    });
    router.refresh();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const res = await fetch(
      `/api/admin/schedules?id=${encodeURIComponent(scheduleId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      pushToast({ title: "Could not delete schedule", variant: "error" });
      return;
    }
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    pushToast({ title: "Schedule deleted", variant: "warning" });
    router.refresh();
  };

  // Management Handlers
  const handleSaveMyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const myRow = appUsers.find(
      (u) => u.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    if (!myRow) return;
    setSavingPhone(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: myRow.id, phone: myPhoneInput.trim() }),
      });
      const data = (await res.json()) as {
        user?: AppUserSummary;
        error?: string;
      };
      if (!res.ok || !data.user) {
        pushToast({
          title: "Could not update phone",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }
      setAppUsers((prev) =>
        prev.map((u) => (u.id === data.user!.id ? data.user! : u))
      );
      pushToast({
        title: "Phone Number Saved",
        subtitle: "You can now log in with your phone number or username!",
        variant: "success",
      });
    } finally {
      setSavingPhone(false);
    }
  };

  const handleResetStudentPassword = async (target: AppUserSummary) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: target.id, resetPassword: true }),
    });
    const data = (await res.json()) as {
      user?: AppUserSummary;
      error?: string;
    };
    if (!res.ok || !data.user) {
      pushToast({
        title: "Could not reset password",
        subtitle: data.error,
        variant: "error",
      });
      return;
    }
    pushToast({
      title: `Password Reset for @${target.username}`,
      subtitle: "Temporary password restored to 12345678.",
      variant: "success",
    });
  };

  const handleClearAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText.trim().toUpperCase() !== "RESET") return;
    setClearingData(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: resetConfirmText.trim() }),
      });
      const data = (await res.json()) as {
        cleared?: boolean;
        activeWeek?: Week;
        error?: string;
      };

      if (!res.ok || !data.cleared) {
        pushToast({
          title: "Failed to clear data",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      setPointLogs([]);
      setStudents((prev) => prev.map((s) => ({ ...s, is_active: true })));
      setSubjects((prev) => prev.map((sub) => ({ ...sub, is_hidden: false })));
      if (data.activeWeek) {
        setWeeks([data.activeWeek]);
      }
      setShowResetModal(false);
      setResetConfirmText("");
      pushToast({
        title: "Returned to Clean Start!",
        subtitle:
          "All solo points reset to 0 (Week 1). All students, schedules & accounts kept safe.",
        variant: "warning",
      });
      router.refresh();
    } finally {
      setClearingData(false);
    }
  };

  const handleCreateWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingWeek(true);
    try {
      const res = await fetch("/api/admin/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWeekName.trim() || `Week ${nextWeekNum}`,
          startDate: newWeekStart,
          endDate: newWeekEnd,
          makeActive: true,
        }),
      });
      const data = (await res.json()) as { week?: Week; error?: string };
      if (!res.ok || !data.week) {
        pushToast({
          title: "Could not start new week",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }
      setWeeks((prev) => [
        ...prev.map((w) => ({ ...w, is_active: false })),
        data.week!,
      ]);
      setNewWeekName("");
      pushToast({
        title: `${data.week.name} Started!`,
        subtitle: "Set as active week. Previous weeks remain safely stored.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setCreatingWeek(false);
    }
  };

  const handleSwitchActiveWeek = async (weekId: string) => {
    const res = await fetch("/api/admin/weeks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekId }),
    });
    const data = (await res.json()) as { week?: Week; error?: string };
    if (!res.ok || !data.week) return;
    setWeeks((prev) => prev.map((w) => ({ ...w, is_active: w.id === weekId })));
    pushToast({
      title: `Switched Active Week to ${data.week.name}`,
      variant: "success",
    });
    router.refresh();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim().length < 2) return;
    setAddingStudent(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStudentName.trim() }),
      });
      const data = (await res.json()) as { student?: Student; error?: string };
      if (!res.ok || !data.student) {
        pushToast({
          title: "Failed to add student",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }
      setStudents((prev) =>
        [...prev, data.student!].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewStudentName("");
      pushToast({
        title: `Added ${data.student.name}`,
        subtitle: "Account created with default password 12345678.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setAddingStudent(false);
    }
  };

  const handleUpdateStudent = async (
    studentId: string,
    payload: { name?: string; isActive?: boolean }
  ) => {
    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, ...payload }),
    });
    const data = (await res.json()) as { student?: Student; error?: string };
    if (!res.ok || !data.student) {
      pushToast({
        title: "Failed to update student",
        subtitle: data.error,
        variant: "error",
      });
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? data.student! : s))
    );
    setEditingStudentId(null);
    pushToast({
      title: `Updated ${data.student.name}`,
      variant: "success",
    });
    router.refresh();
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim().length < 2) return;
    setAddingSubject(true);
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          awardTitle:
            newSubjectAward.trim() || `${newSubjectName.trim()} Champion`,
        }),
      });
      const data = (await res.json()) as { subject?: Subject; error?: string };
      if (!res.ok || !data.subject) {
        pushToast({
          title: "Failed to add subject",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }
      setSubjects((prev) => [...prev, data.subject!]);
      if (!selectedSubjectId) setSelectedSubjectId(data.subject.id);
      setNewSubjectName("");
      setNewSubjectAward("");
      pushToast({
        title: `Added Subject: ${data.subject.name}`,
        variant: "success",
      });
      router.refresh();
    } finally {
      setAddingSubject(false);
    }
  };

  const handleToggleSubjectHidden = async (subject: Subject) => {
    const res = await fetch("/api/admin/subjects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: subject.id,
        isHidden: !subject.is_hidden,
      }),
    });
    const data = (await res.json()) as { subject?: Subject; error?: string };
    if (!res.ok || !data.subject) return;
    setSubjects((prev) =>
      prev.map((s) => (s.id === subject.id ? data.subject! : s))
    );
    pushToast({
      title: `${data.subject.name} ${
        data.subject.is_hidden ? "hidden" : "visible"
      }`,
      variant: "success",
    });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-navy-950">
      <header
        className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-navy-900/95 ${
          hideHeaderOnMobile ? "-translate-y-full md:translate-y-0" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Public Hub
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                MYP 3 Solo Leader Console
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Signed in as <strong>@{currentUser.username}</strong>
                {currentUser.role_title ? ` (${currentUser.role_title})` : ""} •{" "}
                {activeWeek ? `Active: ${activeWeek.name}` : "No active week"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3 Admin Tabs: Daily Input | Schedules | Management */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-navy-950">
              <button
                type="button"
                onClick={() => setActiveTab("daily")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                  activeTab === "daily"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Daily Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedules")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                  activeTab === "schedules"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Schedules
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voting")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                  activeTab === "voting"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Vote className="h-3.5 w-3.5" />
                Voting
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("absences")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                  activeTab === "absences"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <CalendarX2 className="h-3.5 w-3.5" />
                Absences
                {pendingAbsencesCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                    {pendingAbsencesCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manage")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                  activeTab === "manage"
                    ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Management
              </button>
            </div>

            <ThemeToggle />

            <Link
              href="/account"
              title="Account Settings & Change Password"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Password</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* TAB 1: ONE-CLICK SOLO DAILY INPUT */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-navy-900">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="daily-date"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Lesson Date
                  </label>
                  <input
                    id="daily-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="daily-subject"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Current Lesson / Subject
                  </label>
                  <select
                    id="daily-subject"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  >
                    {visibleSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.award_title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="student-quick-search"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Quick Find Student
                  </label>
                  <input
                    id="student-quick-search"
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type student name..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* Solo Student Cards Grid */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActiveStudents.map((student) => {
                const stats = studentStatsMap.get(student.id) ?? {
                  todayPoints: 0,
                  scoredPositiveToday: false,
                  weekPoints: 0,
                };

                return (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 dark:border-slate-800 dark:bg-navy-900 dark:hover:border-blue-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {student.name}
                        </span>
                        {stats.scoredPositiveToday && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                            <Check className="h-3 w-3" />
                            Active Today
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:bg-navy-800 dark:text-slate-300">
                          Today:{" "}
                          {stats.todayPoints > 0
                            ? `+${stats.todayPoints}`
                            : stats.todayPoints}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Wk: {stats.weekPoints}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-5 gap-1.5">
                      <button
                        type="button"
                        disabled={busyStudentKey !== null}
                        onClick={() => handleAwardPoint(student, "Active")}
                        title="Good answer / participation (+1)"
                        className="flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50/80 px-1.5 py-2 text-[11px] font-extrabold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"
                      >
                        {busyStudentKey === `${student.id}-Active` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span>+1</span>
                        )}
                        <span className="text-[10px] font-semibold">Active</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyStudentKey !== null}
                        onClick={() => handleAwardPoint(student, "Star")}
                        title="Great presentation / tough problem solved (+2)"
                        className="flex flex-col items-center justify-center rounded-xl border border-violet-200 bg-violet-50/80 px-1.5 py-2 text-[11px] font-extrabold text-violet-700 transition hover:bg-violet-100 active:scale-95 disabled:opacity-50 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300"
                      >
                        {busyStudentKey === `${student.id}-Star` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span>+2</span>
                        )}
                        <span className="text-[10px] font-semibold">Star</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyStudentKey !== null}
                        onClick={() => handleAwardPoint(student, "Ace")}
                        title="Outstanding achievement (+3)"
                        className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/90 px-1.5 py-2 text-[11px] font-extrabold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300"
                      >
                        {busyStudentKey === `${student.id}-Ace` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span>+3</span>
                        )}
                        <span className="text-[10px] font-semibold">Ace</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyStudentKey !== null}
                        onClick={() => handleAwardPoint(student, "Duty")}
                        title="Class duty: clean board, markers, helped peers (+1)"
                        className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/80 px-1.5 py-2 text-[11px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                      >
                        {busyStudentKey === `${student.id}-Duty` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span>+1</span>
                        )}
                        <span className="text-[10px] font-semibold">Duty</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyStudentKey !== null}
                        onClick={() => {
                          setFairPlayTarget(student);
                          setFairPlayReason("");
                        }}
                        title="Fair-Play deduction (-1, mandatory reason)"
                        className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 px-1.5 py-2 text-[11px] font-extrabold text-rose-700 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <span>-1</span>
                        <span className="text-[10px] font-semibold">Fair</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* TAB 2: CLASS SCHEDULES MANAGER (UPLOAD PHOTO OR ADD LESSONS) */}
        {activeTab === "schedules" && (
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Add New Class Schedule
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a schedule photo from your phone/computer, add daily lesson rows, or both!
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSchedule} className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* Left: Title + Photo Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Schedule Title
                      </label>
                      <input
                        type="text"
                        required
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        placeholder="e.g. MYP 3 Term 2 Schedule"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Schedule Photo (Optional or Primary)
                      </label>
                      <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition hover:border-blue-500 dark:border-slate-700 dark:bg-navy-950/60">
                        <ImagePlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <span className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                          Click to Upload Schedule Photo (PNG / JPG / WebP)
                        </span>
                        <span className="mt-0.5 text-[11px] text-slate-400">
                          Automatically optimized for fast loading
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSchedulePhotoSelect}
                          className="hidden"
                        />
                      </label>

                      {scheduleImagePreview && (
                        <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-800 dark:bg-navy-950">
                          <button
                            type="button"
                            onClick={() => setScheduleImagePreview(null)}
                            className="absolute right-3 top-3 rounded-full bg-rose-600 p-1.5 text-white shadow"
                            title="Remove photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={scheduleImagePreview}
                            alt="Schedule preview"
                            className="mx-auto max-h-64 rounded-xl object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Optional Interactive Timetable Builder */}
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-navy-950/60">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Optional: Add Daily Timetable Rows
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add individual lessons so Today&apos;s Schedule also shows up as cards on TV Mode!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <select
                        value={lessonDay}
                        onChange={(e) => setLessonDay(e.target.value as DayOfWeek)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={lessonPeriod}
                        onChange={(e) => setLessonPeriod(Number(e.target.value))}
                        placeholder="Period #"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                      />

                      <input
                        type="text"
                        value={lessonTime}
                        onChange={(e) => setLessonTime(e.target.value)}
                        placeholder="08:30 - 09:15"
                        className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium sm:col-span-1 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        type="text"
                        value={lessonSubject}
                        onChange={(e) => setLessonSubject(e.target.value)}
                        placeholder="Subject (e.g. Mathematics)"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lessonRoom}
                          onChange={(e) => setLessonRoom(e.target.value)}
                          placeholder="Room / Teacher (optional)"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddDraftLesson}
                          className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                        >
                          + Row
                        </button>
                      </div>
                    </div>

                    {draftLessons.length > 0 && (
                      <div className="max-h-48 space-y-1.5 overflow-y-auto pt-2">
                        {draftLessons.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-navy-900"
                          >
                            <span>
                              <strong>
                                {item.day} #{item.period}
                              </strong>{" "}
                              • {item.subject}{" "}
                              {item.time ? `(${item.time})` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftLessons((prev) =>
                                  prev.filter((x) => x.id !== item.id)
                                )
                              }
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-bold text-white shadow hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {savingSchedule ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing Schedule...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Publish &amp; Set Active Schedule
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Saved Schedules History */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Saved Class Schedules ({schedules.length})
              </h3>
              <div className="mt-4 space-y-3">
                {schedules.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No schedules uploaded yet. Upload your first schedule photo above!
                  </p>
                ) : (
                  schedules.map((sch) => (
                    <div
                      key={sch.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        {sch.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sch.image_url}
                            alt={sch.title}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                          />
                        )}
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {sch.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sch.image_url ? "Photo attached" : "No photo"} •{" "}
                            {sch.entries.length} lesson rows
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sch.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateSchedule(sch.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                          title="Delete schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB: CLASS LEADER VOTING */}
        {activeTab === "voting" && (
          <AdminElectionPanel initialState={initialElection} />
        )}

        {/* TAB: STUDENT ABSENCES */}
        {activeTab === "absences" && (
          <AdminAbsencesPanel
            absences={absences}
            onAbsencesChange={setAbsences}
            onNotify={pushToast}
          />
        )}

        {/* TAB 3: MANAGEMENT */}
        {activeTab === "manage" && (
          <div className="space-y-8">
            {/* 1. Academic Weeks */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Academic Weeks Management
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Start a new week or switch the active week. All historical weeks remain saved.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <form
                  onSubmit={handleCreateWeek}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-navy-950/60"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Start New Week (Week {nextWeekNum})
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">
                      Week Label (optional)
                    </label>
                    <input
                      type="text"
                      value={newWeekName}
                      onChange={(e) => setNewWeekName(e.target.value)}
                      placeholder={`Week ${nextWeekNum}`}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newWeekStart}
                        onChange={(e) => setNewWeekStart(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newWeekEnd}
                        onChange={(e) => setNewWeekEnd(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingWeek}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                    {creatingWeek
                      ? "Creating..."
                      : `Create & Activate Week ${nextWeekNum}`}
                  </button>
                </form>

                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Saved Weeks History
                  </h3>
                  {weeks.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-navy-950/60"
                    >
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {w.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatShortDate(w.start_date)} –{" "}
                          {formatShortDate(w.end_date)}
                        </p>
                      </div>
                      {w.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active Week
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchActiveWeek(w.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-navy-800"
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Solo Students Roster */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      MYP 3 Solo Students Roster ({students.filter((s) => s.is_active).length} Active)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add new classmates or edit names without losing score history.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleAddStudent}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="New student name..."
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={addingStudent}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Student
                  </button>
                </form>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((student) => {
                  const isEditing = editingStudentId === student.id;
                  return (
                    <div
                      key={student.id}
                      className={`rounded-xl border p-3 text-xs ${
                        student.is_active
                          ? "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-navy-950/60"
                          : "border-dashed border-slate-200 opacity-60 dark:border-slate-800"
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingStudentName}
                            onChange={(e) =>
                              setEditingStudentName(e.target.value)
                            }
                            className="w-full rounded-lg border border-blue-400 bg-white px-2 py-1 text-xs font-bold dark:bg-navy-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStudent(student.id, {
                                name: editingStudentName,
                              })
                            }
                            className="rounded-lg bg-emerald-600 p-1.5 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            className="rounded-lg bg-slate-200 p-1.5 text-slate-700 dark:bg-navy-800 dark:text-slate-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {student.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudentId(student.id);
                                setEditingStudentName(student.name);
                              }}
                              title="Rename student"
                              className="rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-navy-800"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStudent(student.id, {
                                  isActive: !student.is_active,
                                })
                              }
                              className="rounded px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-200/70 dark:hover:bg-navy-800"
                            >
                              {student.is_active ? "Archive" : "Restore"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. Subjects */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      IB MYP 3 Subjects
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add new subjects or hide inactive subjects.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleAddSubject}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Subject name (e.g. Arts)..."
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newSubjectAward}
                    onChange={(e) => setNewSubjectAward(e.target.value)}
                    placeholder="Honor title (e.g. Arts Maestro)..."
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={addingSubject}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Subject
                  </button>
                </form>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 ${
                      sub.is_hidden
                        ? "border-dashed border-slate-200 opacity-60 dark:border-slate-800"
                        : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-navy-950/60"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {sub.name}
                      </p>
                      <p className="text-xs text-slate-500">{sub.award_title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSubjectHidden(sub)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-300"
                    >
                      {sub.is_hidden ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Show
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Role Assignment, Co-Admins & Registered Accounts */}
            <AdminRolesPanel
              currentUser={currentUser}
              appUsers={appUsers}
              onUsersChange={setAppUsers}
              myPhoneInput={myPhoneInput}
              onMyPhoneInputChange={setMyPhoneInput}
              savingPhone={savingPhone}
              onSaveMyPhone={handleSaveMyPhone}
              onResetPassword={handleResetStudentPassword}
              onNotify={pushToast}
            />

            {/* 5. Clear Data (Reset Scores to 0) */}
            <section className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-rose-900 dark:text-rose-200">
                      Clear Data (Return Scores to 0)
                    </h2>
                    <p className="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300/80">
                      Resets all solo points back to 0 and restarts at Week 1. All students, schedules, subjects, and accounts stay 100% safe!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResetConfirmText("");
                    setShowResetModal(true);
                  }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-500"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Data (Reset to 0)
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Clear Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/60 dark:bg-navy-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Return Site to Clean Start (0 Points)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Students, schedules, subjects &amp; accounts will NOT be deleted.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleClearAllData} className="mt-4 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <p className="font-bold">What stays 100% safe:</p>
                <p className="mt-0.5">
                  All students, class schedules, subjects, and all user accounts &amp; passwords stay untouched. Only points return to <strong>0</strong> (Week 1).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Type <code className="font-mono text-rose-600">RESET</code> to confirm
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold uppercase text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    clearingData ||
                    resetConfirmText.trim().toUpperCase() !== "RESET"
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
                >
                  {clearingData ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reset Scores to 0"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fair-Play Modal */}
      {fairPlayTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-navy-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    -1 Fair-Play Deduction: {fairPlayTarget.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mandatory transparent reason (visible in Activity Feed)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFairPlayTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitFairPlayModal} className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {FAIR_PLAY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFairPlayReason(preset)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      fairPlayReason === preset
                        ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-950 dark:text-slate-300"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Reason (Required)
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  autoFocus
                  value={fairPlayReason}
                  onChange={(e) => setFairPlayReason(e.target.value)}
                  placeholder="Type or select a fair-play reason..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFairPlayTarget(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingFairPlay || fairPlayReason.trim().length < 3
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
                >
                  {submittingFairPlay ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm -1 Fair-Play"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Toast Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0">
        {toasts.map((toast) => {
          const styles =
            toast.variant === "error"
              ? "border-rose-300 bg-rose-950 text-white"
              : toast.variant === "warning"
              ? "border-amber-300 bg-navy-900 text-white"
              : "border-slate-700 bg-navy-900 text-white";

          return (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xl ${styles}`}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                {toast.variant === "error" ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">
                    {toast.title}
                  </p>
                  {toast.subtitle && (
                    <p className="mt-0.5 text-xs opacity-85">
                      {toast.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {toast.undoLogId && (
                  <button
                    type="button"
                    onClick={() => handleUndo(toast.undoLogId!, toast.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/25"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Undo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-lg p-1 opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

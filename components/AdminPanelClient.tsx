"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  LogOut,
  Phone,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  AppUserSummary,
  HubDataset,
  PointCategory,
  PointLog,
  SessionUser,
  Student,
  Subject,
  TeamBonus,
  Week,
} from "@/types";
import { formatShortDate, getTodayDateISO } from "@/lib/calculations";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminPanelClientProps {
  initialDataset: HubDataset;
  currentUser: SessionUser;
  initialAppUsers?: AppUserSummary[];
}

interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  variant: "success" | "combo" | "warning" | "error";
  undoLogId?: string;
}

const FAIR_PLAY_PRESETS = [
  "Disrupting class discussion",
  "Talking over teacher or peer",
  "Off-task device usage",
  "Unprepared materials / late to seat",
  "Unsportsmanlike comment",
];

export function AdminPanelClient({
  initialDataset,
  currentUser,
  initialAppUsers = [],
}: AdminPanelClientProps) {
  const router = useRouter();

  // Live reactive local state synced with server mutations
  const [appUsers, setAppUsers] = useState<AppUserSummary[]>(initialAppUsers);
  const [myPhoneInput, setMyPhoneInput] = useState<string>(currentUser.phone ?? "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialDataset.students);
  const [subjects, setSubjects] = useState<Subject[]>(initialDataset.subjects);
  const [weeks, setWeeks] = useState<Week[]>(initialDataset.weeks);
  const [pointLogs, setPointLogs] = useState<PointLog[]>(initialDataset.pointLogs);
  const [teamBonuses, setTeamBonuses] = useState<TeamBonus[]>(initialDataset.teamBonuses);

  const [activeTab, setActiveTab] = useState<"daily" | "manage">("daily");

  const activeWeek = useMemo(
    () => weeks.find((w) => w.is_active) ?? weeks[weeks.length - 1],
    [weeks]
  );

  const visibleSubjects = useMemo(
    () => subjects.filter((s) => !s.is_hidden),
    [subjects]
  );

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateISO());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => visibleSubjects[0]?.id ?? subjects[0]?.id ?? ""
  );

  const [busyStudentKey, setBusyStudentKey] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fair-Play (-1) Modal State
  const [fairPlayTarget, setFairPlayTarget] = useState<Student | null>(null);
  const [fairPlayReason, setFairPlayReason] = useState<string>("");
  const [submittingFairPlay, setSubmittingFairPlay] = useState<boolean>(false);

  // Management Tab State — Weeks
  const nextWeekNum = useMemo(
    () => Math.max(0, ...weeks.map((w) => w.week_number)) + 1,
    [weeks]
  );
  const [newWeekName, setNewWeekName] = useState<string>("");
  const [newWeekStart, setNewWeekStart] = useState<string>(() => getTodayDateISO());
  const [newWeekEnd, setNewWeekEnd] = useState<string>(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 6);
    return dt.toISOString().slice(0, 10);
  });
  const [creatingWeek, setCreatingWeek] = useState(false);

  // Management Tab State — Students
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentTeamId, setNewStudentTeamId] = useState(
    initialDataset.teams[0]?.id ?? ""
  );
  const [addingStudent, setAddingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");

  // Management Tab State — Subjects
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectAward, setNewSubjectAward] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  // Management Tab State — Clear All Data Modal
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

  // Calculate per-student points for today & active week
  const studentStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { todayPoints: number; scoredPositiveToday: boolean; weekPoints: number }
    >();
    for (const s of students) {
      map.set(s.id, { todayPoints: 0, scoredPositiveToday: false, weekPoints: 0 });
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

  // Calculate dynamic Team Combo Streak status for selectedDate
  const dateComboStatus = useMemo(() => {
    return initialDataset.teams.map((team) => {
      const activeMembers = students.filter(
        (s) => s.is_active && s.team_id === team.id
      );
      const scoredCount = activeMembers.filter(
        (m) => studentStatsMap.get(m.id)?.scoredPositiveToday
      ).length;
      const hasBonus = teamBonuses.some(
        (b) => b.team_id === team.id && b.date === selectedDate
      );
      return {
        team,
        totalActive: activeMembers.length,
        scoredCount,
        hasBonus,
      };
    });
  }, [initialDataset.teams, students, studentStatsMap, teamBonuses, selectedDate]);

  // Submit Quick Point Action
  const handleAwardPoint = async (
    student: Student,
    category: PointCategory,
    reason?: string
  ) => {
    if (!activeWeek) {
      pushToast({
        title: "No Active Week",
        subtitle: "Please create or activate a week in the Management tab first.",
        variant: "error",
      });
      return;
    }

    if (!selectedSubjectId) {
      pushToast({
        title: "Select a Subject",
        subtitle: "Choose a lesson/subject at the top before awarding points.",
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
        comboAwarded?: boolean;
        teamBonus?: TeamBonus | null;
        teamName?: string;
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
        subtitle: `${subjectObj?.name ?? "Subject"} • ${formatShortDate(selectedDate)}`,
        variant: createdLog.points < 0 ? "warning" : "success",
        undoLogId: createdLog.id,
      });

      if (data.comboAwarded && data.teamBonus) {
        const bonus = data.teamBonus;
        setTeamBonuses((prev) => [bonus, ...prev]);
        pushToast({
          title: `🔥 +5 TEAM COMBO STREAK!`,
          subtitle: `Every member of ${data.teamName ?? "the team"} scored on ${formatShortDate(
            selectedDate
          )}!`,
          variant: "combo",
        });
      }

      router.refresh();
    } catch {
      pushToast({
        title: "Network Error",
        subtitle: "Failed to reach server. Please check your connection.",
        variant: "error",
      });
    } finally {
      setBusyStudentKey(null);
    }
  };

  // Undo Point Action
  const handleUndo = async (logId: string, toastId: string) => {
    dismissToast(toastId);
    try {
      const targetLog = pointLogs.find((l) => l.id === logId);
      const res = await fetch(`/api/admin/points?id=${encodeURIComponent(logId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        undone?: boolean;
        comboRevoked?: boolean;
        error?: string;
      };

      if (!res.ok || !data.undone) {
        pushToast({
          title: "Undo failed",
          subtitle: data.error ?? "Could not undo entry.",
          variant: "error",
        });
        return;
      }

      setPointLogs((prev) => prev.filter((l) => l.id !== logId));
      if (data.comboRevoked && targetLog) {
        setTeamBonuses((prev) =>
          prev.filter(
            (b) => !(b.team_id === targetLog.team_id && b.date === targetLog.date)
          )
        );
      }

      pushToast({
        title: "Action Undone",
        subtitle: data.comboRevoked
          ? "Point log and daily Team Combo bonus were cleanly reverted."
          : "Point log removed.",
        variant: "warning",
      });
      router.refresh();
    } catch {
      pushToast({
        title: "Network error during Undo",
        variant: "error",
      });
    }
  };

  // Submit Fair-Play Modal
  const submitFairPlayModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fairPlayTarget || fairPlayReason.trim().length < 3) return;
    setSubmittingFairPlay(true);
    await handleAwardPoint(fairPlayTarget, "Fair-Play", fairPlayReason.trim());
    setSubmittingFairPlay(false);
    setFairPlayTarget(null);
    setFairPlayReason("");
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  // Update Admin Phone Number
  const handleSaveMyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const myRow = appUsers.find(
      (u) => u.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    if (!myRow) {
      pushToast({
        title: "Connect Supabase first",
        subtitle: "Run schema.sql so account profile changes can be stored.",
        variant: "error",
      });
      return;
    }
    setSavingPhone(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: myRow.id, phone: myPhoneInput.trim() }),
      });
      const data = (await res.json()) as { user?: AppUserSummary; error?: string };
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
        subtitle: "You can now log in using either your phone number or username!",
        variant: "success",
      });
    } finally {
      setSavingPhone(false);
    }
  };

  // Toggle Registered User Role (Admin / Student)
  const handleToggleUserRole = async (target: AppUserSummary) => {
    const nextRole = target.role === "admin" ? "student" : "admin";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: target.id, role: nextRole }),
    });
    const data = (await res.json()) as { user?: AppUserSummary; error?: string };
    if (!res.ok || !data.user) {
      pushToast({
        title: "Could not change role",
        subtitle: data.error,
        variant: "error",
      });
      return;
    }
    setAppUsers((prev) =>
      prev.map((u) => (u.id === data.user!.id ? data.user! : u))
    );
    pushToast({
      title: `@${data.user.username} is now ${data.user.role.toUpperCase()}`,
      variant: "success",
    });
  };

  // Reset Student Password back to 12345678
  const handleResetStudentPassword = async (target: AppUserSummary) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: target.id, resetPassword: true }),
    });
    const data = (await res.json()) as { user?: AppUserSummary; error?: string };
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

  // Clear All Data Handler
  const handleClearAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText.trim().toUpperCase() !== "RESET") return;
    setClearingData(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmText: resetConfirmText.trim(),
        }),
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
      setTeamBonuses([]);
      setStudents((prev) => prev.map((s) => ({ ...s, is_active: true })));
      setSubjects((prev) => prev.map((sub) => ({ ...sub, is_hidden: false })));
      if (data.activeWeek) {
        setWeeks([data.activeWeek]);
      }
      setShowResetModal(false);
      setResetConfirmText("");
      pushToast({
        title: "Returned to Clean Start!",
        subtitle: "All points reset to 0 (Week 1). All students, teams & accounts kept safe.",
        variant: "warning",
      });
      router.refresh();
    } finally {
      setClearingData(false);
    }
  };

  // Management: Start New Week
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
      const created = data.week;
      setWeeks((prev) => [
        ...prev.map((w) => ({ ...w, is_active: false })),
        created,
      ]);
      setNewWeekName("");
      pushToast({
        title: `${created.name} Started!`,
        subtitle: "Set as active week. All previous weeks remain safely stored.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setCreatingWeek(false);
    }
  };

  // Management: Switch Active Week
  const handleSwitchActiveWeek = async (weekId: string) => {
    const res = await fetch("/api/admin/weeks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekId }),
    });
    const data = (await res.json()) as { week?: Week; error?: string };
    if (!res.ok || !data.week) {
      pushToast({
        title: "Could not switch week",
        subtitle: data.error,
        variant: "error",
      });
      return;
    }
    setWeeks((prev) => prev.map((w) => ({ ...w, is_active: w.id === weekId })));
    pushToast({
      title: `Switched Active Week to ${data.week.name}`,
      variant: "success",
    });
    router.refresh();
  };

  // Management: Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim().length < 2) return;
    setAddingStudent(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudentName.trim(),
          teamId: newStudentTeamId,
        }),
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
        subtitle: "Team size & fair averages updated dynamically.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setAddingStudent(false);
    }
  };

  // Management: Update Student (rename, move team, or archive/restore)
  const handleUpdateStudent = async (
    studentId: string,
    payload: { name?: string; teamId?: string; isActive?: boolean }
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
      subtitle: "Score history preserved.",
      variant: "success",
    });
    router.refresh();
  };

  // Management: Add Subject
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

  // Management: Toggle Hide/Show Subject
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
    if (!res.ok || !data.subject) {
      pushToast({
        title: "Failed to update subject",
        subtitle: data.error,
        variant: "error",
      });
      return;
    }
    setSubjects((prev) =>
      prev.map((s) => (s.id === subject.id ? data.subject! : s))
    );
    pushToast({
      title: `${data.subject.name} ${data.subject.is_hidden ? "hidden" : "visible"}`,
      variant: "success",
    });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-navy-950">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-navy-900/95">
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
                MYP 3 Leader Console
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Signed in as <strong>@{currentUser.username}</strong> •{" "}
                {activeWeek ? `Active: ${activeWeek.name}` : "No active week"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
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
                One-Click Input
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
        {!initialDataset.isConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Database Not Connected Yet:</strong> Connect{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
            <code className="font-mono">.env.local</code> and run{" "}
            <code className="font-mono">schema.sql</code> to save points to Supabase.
          </div>
        )}

        {activeTab === "daily" ? (
          <div className="space-y-6">
            {/* Top Lesson & Date Bar */}
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

                <div className="md:col-span-2">
                  <label
                    htmlFor="daily-subject"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Current Lesson / IB MYP 3 Subject
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
              </div>

              {/* Daily Team Combo Streak Progress Pills */}
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3 dark:border-slate-800">
                {dateComboStatus.map((st) => (
                  <div
                    key={st.team.id}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs ${
                      st.hasBonus
                        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 dark:border-slate-800 dark:bg-navy-950/60 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: st.team.color }}
                      />
                      <span>{st.team.name}</span>
                    </div>
                    {st.hasBonus ? (
                      <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400">
                        <Flame className="h-3.5 w-3.5 fill-amber-500" />
                        +5 Combo Unlocked!
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Combo: {st.scoredCount}/{st.totalActive} today
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 3 Clean Team Columns for Fast One-Click Daily Input */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {initialDataset.teams.map((team) => {
                const teamStudents = students.filter(
                  (s) => s.is_active && s.team_id === team.id
                );

                return (
                  <div
                    key={team.id}
                    className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-navy-900"
                  >
                    {/* Team Column Header */}
                    <div
                      className="px-5 py-4 text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                            {team.short_name}
                          </p>
                          <h2 className="text-lg font-black">{team.name}</h2>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
                          <Users className="h-3.5 w-3.5" />
                          {teamStudents.length} members
                        </span>
                      </div>
                    </div>

                    {/* Student Cards */}
                    <div className="divide-y divide-slate-100 p-3 dark:divide-slate-800">
                      {teamStudents.map((student) => {
                        const stats = studentStatsMap.get(student.id) ?? {
                          todayPoints: 0,
                          scoredPositiveToday: false,
                          weekPoints: 0,
                        };

                        return (
                          <div
                            key={student.id}
                            className="py-3 first:pt-1 last:pb-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                  {student.name}
                                </span>
                                {stats.scoredPositiveToday && (
                                  <span
                                    title="Participated today (counts toward Team Combo Streak)"
                                    className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                                  >
                                    <Check className="h-3 w-3" />
                                    Today
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
                                <span className="font-semibold text-slate-400">
                                  Wk: {stats.weekPoints}
                                </span>
                              </div>
                            </div>

                            {/* One-Click Scoring Buttons */}
                            <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                              <button
                                type="button"
                                disabled={busyStudentKey !== null}
                                onClick={() => handleAwardPoint(student, "Active")}
                                title="Good answer / active participation (+1)"
                                className="flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50/80 px-1.5 py-2 text-[11px] font-extrabold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
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
                                title="Great presentation / tough problem solved / peer help (+2)"
                                className="flex flex-col items-center justify-center rounded-xl border border-violet-200 bg-violet-50/80 px-1.5 py-2 text-[11px] font-extrabold text-violet-700 transition hover:bg-violet-100 active:scale-95 disabled:opacity-50 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/50"
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
                                className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/90 px-1.5 py-2 text-[11px] font-extrabold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50"
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
                                title="Classroom duty: clean board, markers, helped class (+1)"
                                className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/80 px-1.5 py-2 text-[11px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
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
                                title="Fair-Play deduction (-1, requires mandatory reason)"
                                className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 px-1.5 py-2 text-[11px] font-extrabold text-rose-700 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
                              >
                                <span>-1</span>
                                <span className="text-[10px] font-semibold">Fair</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        ) : (
          /* MANAGEMENT TAB */
          <div className="space-y-8">
            {/* 1. Weeks Management */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Academic Weeks Management
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Start a new week or switch the active week. All historical logs stay permanently saved.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Create New Week Form */}
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
                    {creatingWeek ? "Creating..." : `Create & Activate Week ${nextWeekNum}`}
                  </button>
                </form>

                {/* Existing Weeks List */}
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
                          {formatShortDate(w.start_date)} – {formatShortDate(w.end_date)}
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

            {/* 2. Manage Students & Teams */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Students &amp; Team Roster
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add new classmates, edit names, or reassign teams without losing score history.
                    </p>
                  </div>
                </div>

                {/* Add Student Inline Form */}
                <form onSubmit={handleAddStudent} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="New student name..."
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                  <select
                    value={newStudentTeamId}
                    onChange={(e) => setNewStudentTeamId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  >
                    {initialDataset.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
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

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {initialDataset.teams.map((team) => {
                  const teamRoster = students.filter((s) => s.team_id === team.id);
                  return (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {team.name}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {teamRoster.filter((s) => s.is_active).length} active
                        </span>
                      </div>

                      <div className="space-y-2">
                        {teamRoster.map((student) => {
                          const isEditing = editingStudentId === student.id;
                          return (
                            <div
                              key={student.id}
                              className={`rounded-xl border p-2.5 text-xs ${
                                student.is_active
                                  ? "border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-navy-950/60"
                                  : "border-dashed border-slate-200 opacity-60 dark:border-slate-800"
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingStudentName}
                                    onChange={(e) => setEditingStudentName(e.target.value)}
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
                                    title="Save name"
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
                                      title="Edit student name"
                                      className="rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-navy-800"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>

                                    <select
                                      aria-label={`Move ${student.name} to team`}
                                      value={student.team_id}
                                      onChange={(e) =>
                                        handleUpdateStudent(student.id, {
                                          teamId: e.target.value,
                                        })
                                      }
                                      className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200"
                                    >
                                      {initialDataset.teams.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.short_name}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStudent(student.id, {
                                          isActive: !student.is_active,
                                        })
                                      }
                                      title={
                                        student.is_active
                                          ? "Mark inactive"
                                          : "Restore active"
                                      }
                                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-200/70 dark:hover:bg-navy-800"
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
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. Manage Subjects */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      IB MYP 3 Subjects
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add new subjects or hide inactive subjects from daily dropdowns.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddSubject} className="flex flex-wrap items-center gap-2">
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

            {/* 4. Registered Accounts & Admins Management */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Registered Accounts &amp; Admins
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Link your phone number for phone login, or grant co-leader Admin access (e.g. Fazliya).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveMyPhone} className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={myPhoneInput}
                      onChange={(e) => setMyPhoneInput(e.target.value)}
                      placeholder="Your phone (+998...)"
                      className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {savingPhone ? "Saving..." : "Save My Phone"}
                  </button>
                </form>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="py-2.5 pr-3">Username</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {appUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white">
                          @{u.username}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {u.phone ?? "Not set yet"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              u.role === "admin"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300"
                            }`}
                          >
                            {u.role === "admin" ? "Admin" : "Student"}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          {u.username.toLowerCase() === "yahyoo_erikovich" ? (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Primary Owner
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResetStudentPassword(u)}
                                title="Reset student password back to 12345678"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-navy-800"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Reset PW
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserRole(u)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-navy-800"
                              >
                                {u.role === "admin" ? "Make Student" : "Make Admin"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {appUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Connect Supabase and run schema.sql to view registered accounts.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Danger Zone — Clear All Data */}
            <section className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-rose-900 dark:text-rose-200">
                      Clear All Data (Reset Scores &amp; Weeks)
                    </h2>
                    <p className="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300/80">
                      Wipes all awarded points, penalties, Team Combo Streaks, and resets weeks back to a fresh Week 1 while keeping your students, teams, and accounts safe.
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
                  <Trash2 className="h-4 w-4" />
                  Clear Data (Reset to 0)
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Clear All Data Confirmation Modal */}
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
                    Students, teams, subjects, and accounts will NOT be deleted.
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
                  All 19 students, all 3 teams, all 7 subjects, and all user accounts &amp; passwords remain untouched. Only points &amp; combo streaks return to <strong>0</strong> (Week 1).
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
                    clearingData || resetConfirmText.trim().toUpperCase() !== "RESET"
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
                >
                  {clearingData ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Clear All Data Now"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Reason Modal for -1 Fair-Play */}
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
                    Mandatory transparent reason (visible in Recent Activity Feed)
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
                  disabled={submittingFairPlay || fairPlayReason.trim().length < 3}
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

      {/* Instant Toast Stack with Undo Button */}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0">
        {toasts.map((toast) => {
          const styles =
            toast.variant === "combo"
              ? "border-amber-400 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              : toast.variant === "error"
              ? "border-rose-300 bg-rose-950 text-white"
              : toast.variant === "warning"
              ? "border-amber-300 bg-navy-900 text-white"
              : "border-slate-700 bg-navy-900 text-white";

          return (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xl ${styles}`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {toast.variant === "combo" ? (
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
                ) : toast.variant === "error" ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{toast.title}</p>
                  {toast.subtitle && (
                    <p className="mt-0.5 text-xs opacity-85">{toast.subtitle}</p>
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

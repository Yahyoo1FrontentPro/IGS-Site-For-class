"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Crown,
  FileText,
  Filter,
  Flame,
  GraduationCap,
  Info,
  LogIn,
  LogOut,
  Medal,
  MonitorPlay,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  User,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import {
  FairnessMode,
  HubDataset,
  SessionUser,
} from "@/types";
import {
  buildActivityFeed,
  calculateMostImproved,
  calculateOverallMVP,
  calculateStudentLeaderboard,
  calculateSubjectChampions,
  calculateTeamStandings,
  filterByWeek,
  formatShortDate,
  formatTimestampRelative,
} from "@/lib/calculations";
import { TeamRaceChart } from "@/components/TeamRaceChart";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PublicDashboardClientProps {
  dataset: HubDataset;
  sessionUser?: SessionUser | null;
}

export function PublicDashboardClient({
  dataset,
  sessionUser = null,
}: PublicDashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const activeWeek = useMemo(
    () => dataset.weeks.find((w) => w.is_active) ?? dataset.weeks[dataset.weeks.length - 1],
    [dataset.weeks]
  );

  const [selectedWeekId, setSelectedWeekId] = useState<string>(activeWeek?.id ?? "all");
  const [fairnessMode, setFairnessMode] = useState<FairnessMode>("average");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const weekPointLogs = useMemo(
    () => filterByWeek(dataset.pointLogs, selectedWeekId),
    [dataset.pointLogs, selectedWeekId]
  );

  const weekTeamBonuses = useMemo(
    () => filterByWeek(dataset.teamBonuses, selectedWeekId),
    [dataset.teamBonuses, selectedWeekId]
  );

  const standings = useMemo(
    () =>
      calculateTeamStandings(
        dataset.teams,
        dataset.students,
        weekPointLogs,
        weekTeamBonuses,
        fairnessMode
      ),
    [dataset.teams, dataset.students, weekPointLogs, weekTeamBonuses, fairnessMode]
  );

  const overallLeaderboard = useMemo(
    () =>
      calculateStudentLeaderboard(
        dataset.students,
        dataset.teams,
        weekPointLogs,
        "all"
      ),
    [dataset.students, dataset.teams, weekPointLogs]
  );

  const filteredLeaderboard = useMemo(() => {
    const base = calculateStudentLeaderboard(
      dataset.students,
      dataset.teams,
      weekPointLogs,
      selectedSubjectFilter
    );
    return base.filter((row) => {
      if (selectedTeamFilter !== "all" && row.team.id !== selectedTeamFilter) {
        return false;
      }
      if (
        searchQuery.trim().length > 0 &&
        !row.student.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [
    dataset.students,
    dataset.teams,
    weekPointLogs,
    selectedSubjectFilter,
    selectedTeamFilter,
    searchQuery,
  ]);

  const mvp = useMemo(() => calculateOverallMVP(overallLeaderboard), [overallLeaderboard]);

  const winningTeam = useMemo(() => {
    const top = standings[0];
    if (!top || top.totalPoints <= 0) return null;
    return top;
  }, [standings]);

  const subjectChampions = useMemo(
    () =>
      calculateSubjectChampions(
        dataset.subjects,
        dataset.students,
        dataset.teams,
        weekPointLogs
      ),
    [dataset.subjects, dataset.students, dataset.teams, weekPointLogs]
  );

  const mostImproved = useMemo(
    () =>
      calculateMostImproved(
        selectedWeekId,
        dataset.weeks,
        dataset.students,
        dataset.teams,
        dataset.pointLogs
      ),
    [selectedWeekId, dataset.weeks, dataset.students, dataset.teams, dataset.pointLogs]
  );

  const activityFeed = useMemo(
    () =>
      buildActivityFeed(
        weekPointLogs,
        weekTeamBonuses,
        dataset.students,
        dataset.teams,
        dataset.subjects,
        24
      ),
    [weekPointLogs, weekTeamBonuses, dataset.students, dataset.teams, dataset.subjects]
  );

  const selectedWeekObj = useMemo(
    () => dataset.weeks.find((w) => w.id === selectedWeekId) ?? null,
    [dataset.weeks, selectedWeekId]
  );

  const visibleSubjects = useMemo(
    () => dataset.subjects.filter((s) => !s.is_hidden),
    [dataset.subjects]
  );

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Top School Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-navy-900/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-blue-700 text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                  International GoldStars School • MYP 3 Activity Hub
                </h1>
                <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 sm:inline-flex dark:bg-amber-950/70 dark:text-amber-300">
                  Leaders: Yahyo &amp; Fazliya
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IB Middle Years Programme • Transparent House Points, Combo Streaks &amp; Weekly Honors
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Active Week Selector */}
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <select
                aria-label="Select week"
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-100"
              >
                {dataset.weeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    {week.name}
                    {week.is_active ? " (Active)" : ""}
                  </option>
                ))}
                <option value="all">All-Time Cumulative</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh live scores"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <Link
              href={`/report?week=${encodeURIComponent(selectedWeekId)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
            >
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Report</span>
            </Link>

            <Link
              href="/tv"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:text-sm"
            >
              <MonitorPlay className="h-4 w-4" />
              <span>Classroom TV Mode</span>
            </Link>

            {sessionUser ? (
              <>
                {sessionUser.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-700 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  title="Account Settings & Change Password"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
                >
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>@{sessionUser.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log Out"
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-700 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </Link>
              </>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Database Setup Status Banner (only shown if .env.local not yet connected) */}
        {!dataset.isConfigured && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 shadow-sm dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-bold">Preview Mode Active — Connect Supabase for Live Persistence</p>
                <p className="mt-0.5 text-xs opacity-90">
                  {dataset.errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Period Sub-banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-navy-900">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              {selectedWeekId === "all" ? "All-Time Standings" : selectedWeekObj?.name ?? "Weekly View"}
            </span>
            {selectedWeekObj && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formatShortDate(selectedWeekObj.start_date)} – {formatShortDate(selectedWeekObj.end_date)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <strong className="text-slate-800 dark:text-slate-200">
                {dataset.students.filter((s) => s.is_active).length}
              </strong>{" "}
              Active Students
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-800 dark:text-slate-200">
                {weekPointLogs.length}
              </strong>{" "}
              Logs Recorded
            </span>
            <span>•</span>
            <span>
              <strong className="text-amber-600 dark:text-amber-400">
                {weekTeamBonuses.length}
              </strong>{" "}
              Team Combos
            </span>
          </div>
        </div>

        {/* SECTION 1: LIVE 3-TEAM HOUSE RACE */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-navy-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Live 3-Team House Race
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                Dynamic fairness system accounting for unequal team sizes (6 vs 7 students) plus +5 Team Combo Streaks.
              </p>
            </div>

            {/* Fairness Toggle Switch */}
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <div
                role="group"
                aria-label="Fairness scoring mode"
                className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-navy-950"
              >
                <button
                  type="button"
                  onClick={() => setFairnessMode("average")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition sm:text-sm ${
                    fairnessMode === "average"
                      ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  Fair Average (Pts / Student)
                </button>
                <button
                  type="button"
                  onClick={() => setFairnessMode("total")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition sm:text-sm ${
                    fairnessMode === "total"
                      ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Total Points
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Ranking sorted by{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  {fairnessMode === "average" ? "Average Points per Member" : "Raw Total Points"}
                </strong>
              </span>
            </div>
          </div>

          {/* Recharts Animated Horizontal Bar Chart */}
          <div className="mt-5">
            <TeamRaceChart standings={standings} fairnessMode={fairnessMode} height={225} />
          </div>

          {/* 3 Team Detail Cards Showing BOTH Fair Average & Total Points */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {standings.map((item) => {
              const isFirst = item.rank === 1 && item.totalPoints > 0;
              return (
                <div
                  key={item.team.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                    isFirst
                      ? "border-amber-300 bg-gradient-to-br from-amber-50/60 via-white to-white shadow-md dark:border-amber-600/50 dark:from-amber-950/20 dark:via-navy-900 dark:to-navy-900"
                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-navy-950/60"
                  }`}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ backgroundColor: item.team.color }}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-extrabold text-white"
                          style={{ backgroundColor: item.team.color }}
                        >
                          #{item.rank}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {item.team.short_name}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-lg font-extrabold text-slate-900 dark:text-white">
                        {item.team.name}
                      </h3>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5" />
                      {item.memberCount} members
                    </span>
                  </div>

                  {/* Both Metrics Clearly Displayed */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div
                      className={`rounded-xl p-3 ${
                        fairnessMode === "average"
                          ? "bg-white ring-2 ring-blue-500/30 shadow-sm dark:bg-navy-800"
                          : "bg-white/70 dark:bg-navy-900/80"
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Fair Average
                      </p>
                      <p className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
                        {item.averagePoints.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-400">pts / student</p>
                    </div>

                    <div
                      className={`rounded-xl p-3 ${
                        fairnessMode === "total"
                          ? "bg-white ring-2 ring-blue-500/30 shadow-sm dark:bg-navy-800"
                          : "bg-white/70 dark:bg-navy-900/80"
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Total Points
                      </p>
                      <p className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
                        {item.totalPoints}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.studentPoints} individual + {item.bonusPoints} bonus
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                      <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                      Combo Streaks: {item.comboCount}x
                    </span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      +{item.bonusPoints} bonus pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: WEEKLY AWARDS & AUTOMATIC CALCULATIONS */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {selectedWeekId === "all" ? "All-Time Honors & Champions" : "Weekly Honors & Champions"}
              </h2>
            </div>
          </div>

          {/* Primary 3 Major Honors Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* 1. Overall MVP */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm dark:border-amber-800/50 dark:from-amber-950/30 dark:via-navy-900 dark:to-navy-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  <Crown className="h-3.5 w-3.5" />
                  Overall MVP
                </span>
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              {mvp ? (
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {mvp.student.name}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: mvp.team.color }}
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {mvp.team.name}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                      {mvp.totalPoints}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      total points across all subjects
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Awaiting first points
                  </p>
                  <p className="mt-1 text-xs">
                    Once points are logged for this period, the top-scoring student appears here automatically.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Winning Team */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm dark:border-blue-800/50 dark:from-blue-950/30 dark:via-navy-900 dark:to-navy-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Leading House ({fairnessMode === "average" ? "Fair Avg" : "Total"})
                </span>
                <Medal className="h-5 w-5 text-blue-500" />
              </div>
              {winningTeam ? (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: winningTeam.team.color }}
                    />
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {winningTeam.team.name}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {winningTeam.memberCount} active students • {winningTeam.comboCount} Combo Streaks
                  </p>
                  <div className="mt-4 flex flex-wrap items-baseline gap-3">
                    <div>
                      <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                        {fairnessMode === "average"
                          ? winningTeam.averagePoints.toFixed(2)
                          : winningTeam.totalPoints}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {fairnessMode === "average" ? "pts/student" : "total pts"}
                      </span>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                      {fairnessMode === "average"
                        ? `${winningTeam.totalPoints} total pts`
                        : `${winningTeam.averagePoints.toFixed(2)} avg/student`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Race ready to begin
                  </p>
                  <p className="mt-1 text-xs">
                    All 3 houses start even. Points and +5 Team Combo Streaks update standings live.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Most Improved Student */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm dark:border-emerald-800/50 dark:from-emerald-950/30 dark:via-navy-900 dark:to-navy-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Most Improved
                </span>
                <Sparkles className="h-5 w-5 text-emerald-500" />
              </div>

              {!mostImproved.hasPreviousWeek ? (
                <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Baseline Week in Progress
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    No previous week exists yet. Starting in <strong>Week 2</strong>, this award automatically highlights the student with the biggest score jump!
                  </p>
                </div>
              ) : mostImproved.student && mostImproved.team ? (
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {mostImproved.student.name}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: mostImproved.team.color }}
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {mostImproved.team.name}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      +{mostImproved.delta} pts
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({mostImproved.previousPoints} → {mostImproved.currentPoints} vs{" "}
                      {mostImproved.previousWeekName})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Comparing vs {mostImproved.previousWeekName}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    As students surpass their {mostImproved.previousWeekName} score, the biggest positive jump will be crowned here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Subject Champions Grid */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <BookOpen className="h-4 w-4" />
              IB MYP 3 Subject Champions
            </h3>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {subjectChampions.map((champ) => (
                <div
                  key={champ.subject.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-navy-900 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-navy-800 dark:text-slate-300">
                        {champ.subject.award_title}
                      </span>
                      {champ.points > 0 && (
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {champ.points} pts
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {champ.subject.name}
                    </p>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {champ.student && champ.team ? (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {champ.student.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: champ.team.color }}
                            />
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {champ.team.short_name}
                              {champ.tiedCount > 1 ? ` (+${champ.tiedCount - 1} tied)` : ""}
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400 dark:text-slate-500">
                        No points logged yet
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: LEADERBOARD + RECENT ACTIVITY FEED */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Full Class Leaderboard Table (2 columns on desktop) */}
          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-navy-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Full Class Leaderboard
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filter by House Team or Subject to inspect individual contributions.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                  Showing {filteredLeaderboard.length} students
                </span>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-slate-100"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    aria-label="Filter by team"
                    value={selectedTeamFilter}
                    onChange={(e) => setSelectedTeamFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-slate-100"
                  >
                    <option value="all">All 3 Teams</option>
                    {dataset.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.short_name} — {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    aria-label="Filter by subject"
                    value={selectedSubjectFilter}
                    onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-slate-100"
                  >
                    <option value="all">All Subjects</option>
                    {visibleSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="py-3 pr-3">Rank</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Team</th>
                    <th className="py-3 px-3">Breakdown</th>
                    <th className="py-3 pl-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredLeaderboard.map((row) => {
                    const medalColor =
                      row.rank === 1 && row.totalPoints > 0
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                        : row.rank === 2 && row.totalPoints > 0
                        ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                        : row.rank === 3 && row.totalPoints > 0
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                        : "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400";

                    return (
                      <tr
                        key={row.student.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-navy-800/40"
                      >
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${medalColor}`}
                          >
                            #{row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {row.student.name}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: row.team.color }}
                          >
                            {row.team.name}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                            {row.activeCount > 0 && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                Active ×{row.activeCount}
                              </span>
                            )}
                            {row.starCount > 0 && (
                              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                                Star ×{row.starCount}
                              </span>
                            )}
                            {row.aceCount > 0 && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                Ace ×{row.aceCount}
                              </span>
                            )}
                            {row.dutyCount > 0 && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Duty ×{row.dutyCount}
                              </span>
                            )}
                            {row.fairPlayCount > 0 && (
                              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                Fair-Play ×{row.fairPlayCount}
                              </span>
                            )}
                            {row.activeCount === 0 &&
                              row.starCount === 0 &&
                              row.aceCount === 0 &&
                              row.dutyCount === 0 &&
                              row.fairPlayCount === 0 && (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              )}
                          </div>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {row.totalPoints}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                        No students match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Activity Feed */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-navy-900">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Recent Activity Feed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% transparent log of points &amp; Combo Streaks.
              </p>
            </div>

            <div className="mt-4 max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {activityFeed.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                  <Sparkles className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No activity logged yet
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Points awarded by Class Leaders Yahyo &amp; Fazliya will appear here in real time.
                  </p>
                </div>
              ) : (
                activityFeed.map((item) => {
                  const isBonus = item.type === "bonus";
                  const isNegative = item.points < 0;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-3.5 transition ${
                        isBonus
                          ? "border-amber-300 bg-amber-50/70 dark:border-amber-700/60 dark:bg-amber-950/30"
                          : "border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-navy-950/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {isBonus ? (
                            <div className="flex items-center gap-1.5">
                              <Flame className="h-4 w-4 shrink-0 text-amber-500" />
                              <p className="truncate text-sm font-extrabold text-amber-900 dark:text-amber-200">
                                {item.team.name} Combo!
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {item.studentName}
                              </span>
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                style={{ backgroundColor: item.team.color }}
                              >
                                {item.team.short_name}
                              </span>
                            </div>
                          )}

                          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {isBonus ? (
                              item.reason
                            ) : (
                              <>
                                <span className="font-semibold">{item.category}</span> •{" "}
                                {item.subjectName}
                              </>
                            )}
                          </p>

                          {!isBonus && item.reason && (
                            <p className="mt-1 rounded-lg bg-white/80 px-2 py-1 text-[11px] italic text-slate-600 dark:bg-navy-900 dark:text-slate-400">
                              Reason: &ldquo;{item.reason}&rdquo;
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black ${
                            isBonus
                              ? "bg-amber-500 text-white"
                              : isNegative
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Log Date: {formatShortDate(item.date)}</span>
                        <span>{formatTimestampRelative(item.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-navy-900 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          International GoldStars School • IB MYP 3 Activity Hub
        </p>
        <p className="mt-1">
          Maintained by Class Leaders Yahyo &amp; Fazliya • Fair House Scoring &amp; Collaborative Excellence
        </p>
      </footer>
    </div>
  );
}

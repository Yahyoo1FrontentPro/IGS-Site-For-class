"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  Calendar,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Crown,
  FileText,
  GraduationCap,
  LogIn,
  LogOut,
  Medal,
  MonitorPlay,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  User,
  UserPlus,
  Vote,
} from "lucide-react";
import { ElectionState, HubDataset, SessionUser } from "@/types";
import {
  buildActivityFeed,
  calculateMostImproved,
  calculateOverallMVP,
  calculateStudentLeaderboard,
  calculateSubjectChampions,
  filterByWeek,
  formatShortDate,
  formatTimestampRelative,
} from "@/lib/calculations";
import { SoloRaceChart } from "@/components/TeamRaceChart";
import { WEEKLY_PRIZES, getPrizeForPlace } from "@/lib/prizes";
import { ScheduleViewer } from "@/components/ScheduleViewer";
import { LeaderElectionCard } from "@/components/LeaderElectionCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useHideOnMobileScroll } from "@/lib/useHideOnMobileScroll";

interface PublicDashboardClientProps {
  dataset: HubDataset;
  sessionUser?: SessionUser | null;
  electionState: ElectionState;
}

export function PublicDashboardClient({
  dataset,
  sessionUser = null,
  electionState,
}: PublicDashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const hideHeaderOnMobile = useHideOnMobileScroll();

  const activeWeek = useMemo(
    () =>
      dataset.weeks.find((w) => w.is_active) ??
      dataset.weeks[dataset.weeks.length - 1],
    [dataset.weeks]
  );

  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    activeWeek?.id ?? "all"
  );
  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const weekPointLogs = useMemo(
    () => filterByWeek(dataset.pointLogs, selectedWeekId),
    [dataset.pointLogs, selectedWeekId]
  );

  const overallLeaderboard = useMemo(
    () =>
      calculateStudentLeaderboard(dataset.students, weekPointLogs, "all"),
    [dataset.students, weekPointLogs]
  );

  const filteredLeaderboard = useMemo(() => {
    const base = calculateStudentLeaderboard(
      dataset.students,
      weekPointLogs,
      selectedSubjectFilter
    );
    return base.filter((row) => {
      if (
        searchQuery.trim().length > 0 &&
        !row.student.name
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [dataset.students, weekPointLogs, selectedSubjectFilter, searchQuery]);

  const mvp = useMemo(
    () => calculateOverallMVP(overallLeaderboard),
    [overallLeaderboard]
  );

  const top3Podium = useMemo(
    () => overallLeaderboard.slice(0, 3),
    [overallLeaderboard]
  );

  const subjectChampions = useMemo(
    () =>
      calculateSubjectChampions(
        dataset.subjects,
        dataset.students,
        weekPointLogs
      ),
    [dataset.subjects, dataset.students, weekPointLogs]
  );

  const mostImproved = useMemo(
    () =>
      calculateMostImproved(
        selectedWeekId,
        dataset.weeks,
        dataset.students,
        dataset.pointLogs
      ),
    [selectedWeekId, dataset.weeks, dataset.students, dataset.pointLogs]
  );

  const topActiveStudent = useMemo(() => {
    if (overallLeaderboard.length === 0) return null;
    const sorted = [...overallLeaderboard].sort((a, b) => {
      const aTotalActs = a.activeCount + a.starCount + a.aceCount + a.dutyCount;
      const bTotalActs = b.activeCount + b.starCount + b.aceCount + b.dutyCount;
      if (bTotalActs !== aTotalActs) return bTotalActs - aTotalActs;
      return b.totalPoints - a.totalPoints;
    });
    const best = sorted[0];
    const count =
      best.activeCount + best.starCount + best.aceCount + best.dutyCount;
    return count > 0 ? { row: best, count } : null;
  }, [overallLeaderboard]);

  const activityFeed = useMemo(
    () =>
      buildActivityFeed(
        weekPointLogs,
        dataset.students,
        dataset.subjects,
        24
      ),
    [weekPointLogs, dataset.students, dataset.subjects]
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
      <header
        className={`sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-navy-900/95 ${
          hideHeaderOnMobile ? "-translate-y-full md:translate-y-0" : "translate-y-0"
        }`}
      >
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
                IB Middle Years Programme • Individual Solo Standings, Class Schedule &amp; Weekly Honors
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
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            <Link
              href="/vote"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition sm:text-sm ${
                electionState.openElection
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
              }`}
            >
              <Vote className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Vote{electionState.openElection ? " (OPEN)" : ""}</span>
            </Link>

            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
            >
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Schedule</span>
            </Link>

            <Link
              href="/rules"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
            >
              <BookOpenCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Rules &amp; Duty</span>
            </Link>

            <Link
              href="/absence"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 sm:text-sm dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950"
            >
              <CalendarX2 className="h-4 w-4" />
              <span>Report Absence</span>
            </Link>

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
              <span>TV Mode</span>
            </Link>

            {sessionUser ? (
              <>
                {sessionUser.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-700 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  title="Account Settings & Change Password"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700"
                >
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>@{sessionUser.username}</span>
                  {sessionUser.role_title && (
                    <span className="hidden rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 sm:inline dark:bg-indigo-950 dark:text-indigo-300">
                      {sessionUser.role_title}
                    </span>
                  )}
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
        {/* Selected Period Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-navy-900">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              {selectedWeekId === "all"
                ? "All-Time Solo Standings"
                : selectedWeekObj?.name ?? "Weekly View"}
            </span>
            {selectedWeekObj && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formatShortDate(selectedWeekObj.start_date)} –{" "}
                {formatShortDate(selectedWeekObj.end_date)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <strong className="text-slate-800 dark:text-slate-200">
                {dataset.students.filter((s) => s.is_active).length}
              </strong>{" "}
              Solo Competitors
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-800 dark:text-slate-200">
                {weekPointLogs.length}
              </strong>{" "}
              Activity Logs
            </span>
          </div>
        </div>

        {/* Class Leader Vote (only active when admin opens it) */}
        <LeaderElectionCard initialState={electionState} sessionUser={sessionUser} />

        {/* SECTION 1: LIVE SOLO STANDINGS RACE & TOP 3 PODIUM */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-navy-900">
          <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Live MYP 3 Solo Standings Race
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Every student competes individually based on classroom participation, achievements, and class duty.
            </p>
          </div>

          {/* Weekly Chocolate Prizes */}
          <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 dark:border-amber-800/50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30">
            <p className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              🍫 Weekly Prizes for the Top 3 Students
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {WEEKLY_PRIZES.map((p) => (
                <div
                  key={p.place}
                  className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-white/80 px-3.5 py-2.5 dark:border-amber-800/40 dark:bg-navy-900/70"
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {p.label}
                    </p>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {p.prize}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Solo Podium Cards */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {top3Podium.map((item, idx) => {
              const rankColors =
                idx === 0
                  ? "border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-white dark:border-amber-600/50 dark:from-amber-950/25 dark:via-navy-900 dark:to-navy-900"
                  : idx === 1
                  ? "border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:border-indigo-700/50 dark:from-indigo-950/25 dark:via-navy-900 dark:to-navy-900"
                  : "border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:border-emerald-700/50 dark:from-emerald-950/25 dark:via-navy-900 dark:to-navy-900";

              const pillColors =
                idx === 0
                  ? "bg-amber-500 text-white"
                  : idx === 1
                  ? "bg-indigo-600 text-white"
                  : "bg-emerald-600 text-white";

              return (
                <div
                  key={item.student.id}
                  className={`rounded-2xl border p-5 shadow-sm ${rankColors}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${pillColors}`}
                    >
                      <Medal className="h-3.5 w-3.5" />#{item.rank}{" "}
                      {idx === 0 ? "Leader" : idx === 1 ? "2nd Place" : "3rd Place"}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Solo Rank
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-black text-slate-900 dark:text-white">
                    {item.student.name}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {item.totalPoints}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      points
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Active ×{item.activeCount} • Star ×{item.starCount} • Ace ×
                    {item.aceCount} • Duty ×{item.dutyCount}
                  </p>
                  {getPrizeForPlace(idx + 1) && (
                    <p className="mt-3 rounded-lg bg-amber-100/80 px-2.5 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      🎁 Prize: {getPrizeForPlace(idx + 1)!.prize}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Animated Top 8 Solo Students Bar Chart */}
          <div className="mt-6">
            <SoloRaceChart leaderboard={overallLeaderboard} maxBars={8} height={280} />
          </div>
        </section>

        {/* SECTION 2: CLASS SCHEDULE */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-navy-900">
          <ScheduleViewer
            schedules={dataset.schedules}
            sessionUser={sessionUser}
            standalone={false}
          />
        </section>

        {/* SECTION 3: WEEKLY SOLO HONORS & SUBJECT CHAMPIONS */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {selectedWeekId === "all"
                ? "All-Time Solo Honors & Subject Champions"
                : "Weekly Solo Honors & Subject Champions"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* 1. Overall Solo MVP */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm dark:border-amber-800/50 dark:from-amber-950/30 dark:via-navy-900 dark:to-navy-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  <Crown className="h-3.5 w-3.5" />
                  Overall Solo MVP
                </span>
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              {mvp ? (
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {mvp.student.name}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
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
                    The highest-scoring student of the week is automatically crowned here.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Most Active Participant */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm dark:border-blue-800/50 dark:from-blue-950/30 dark:via-navy-900 dark:to-navy-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Most Active Student
                </span>
                <Medal className="h-5 w-5 text-blue-500" />
              </div>
              {topActiveStudent ? (
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {topActiveStudent.row.student.name}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {topActiveStudent.count}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      positive contributions logged
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Ready for participation
                  </p>
                  <p className="mt-1 text-xs">
                    Recognizes the student with the highest number of positive class contributions.
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
                    Starting in <strong>Week 2</strong>, this honor automatically highlights the student with the biggest score jump!
                  </p>
                </div>
              ) : mostImproved.student ? (
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {mostImproved.student.name}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
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
                    As students surpass their {mostImproved.previousWeekName} total, the biggest positive jump will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Subject Champions Grid */}
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
                    {champ.student ? (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {champ.student.name}
                          </p>
                          {champ.tiedCount > 1 && (
                            <p className="text-[11px] text-slate-500">
                              +{champ.tiedCount - 1} tied
                            </p>
                          )}
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

        {/* SECTION 4: FULL SOLO LEADERBOARD + RECENT ACTIVITY FEED */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Solo Leaderboard Table */}
          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-navy-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Full Class Solo Leaderboard
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filter by subject or search any classmate.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                  {filteredLeaderboard.length} students
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="py-3 pr-3">Rank</th>
                    <th className="py-3 px-3">Student</th>
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
                                <span className="text-slate-400 dark:text-slate-500">
                                  —
                                </span>
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
                      <td
                        colSpan={4}
                        className="py-8 text-center text-sm text-slate-400"
                      >
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
                100% transparent log of solo points awarded.
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
                  const isNegative = item.points < 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition dark:border-slate-800 dark:bg-navy-950/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {item.studentName}
                          </span>
                          <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">{item.category}</span> •{" "}
                            {item.subjectName}
                          </p>
                          {item.reason && (
                            <p className="mt-1 rounded-lg bg-white/80 px-2 py-1 text-[11px] italic text-slate-600 dark:bg-navy-900 dark:text-slate-400">
                              Reason: &ldquo;{item.reason}&rdquo;
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black ${
                            isNegative
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Date: {formatShortDate(item.date)}</span>
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
          International GoldStars School • IB MYP 3 Solo Activity Hub
        </p>
        <p className="mt-1">
          Maintained by Class Leaders Yahyo &amp; Fazliya
        </p>
      </footer>
    </div>
  );
}

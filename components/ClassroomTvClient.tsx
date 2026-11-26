"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Flame,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scale,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { FairnessMode, HubDataset } from "@/types";
import {
  calculateStudentLeaderboard,
  calculateTeamStandings,
  filterByWeek,
  getTodayDateISO,
} from "@/lib/calculations";
import { TeamRaceChart } from "@/components/TeamRaceChart";

interface ClassroomTvClientProps {
  dataset: HubDataset;
}

export function ClassroomTvClient({ dataset }: ClassroomTvClientProps) {
  const router = useRouter();
  const activeWeek = useMemo(
    () => dataset.weeks.find((w) => w.is_active) ?? dataset.weeks[dataset.weeks.length - 1],
    [dataset.weeks]
  );

  const [selectedWeekId, setSelectedWeekId] = useState<string>(activeWeek?.id ?? "all");
  const [fairnessMode, setFairnessMode] = useState<FairnessMode>("average");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [clockText, setClockText] = useState<string>("");

  // Clock + periodic auto-refresh for Homeroom projector
  useEffect(() => {
    const updateClock = () => {
      setClockText(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const clockInterval = window.setInterval(updateClock, 15000);
    const refreshInterval = window.setInterval(() => {
      router.refresh();
    }, 20000);

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      window.clearInterval(clockInterval);
      window.clearInterval(refreshInterval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [router]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen browser restrictions
    }
  };

  const weekLogs = useMemo(
    () => filterByWeek(dataset.pointLogs, selectedWeekId),
    [dataset.pointLogs, selectedWeekId]
  );
  const weekBonuses = useMemo(
    () => filterByWeek(dataset.teamBonuses, selectedWeekId),
    [dataset.teamBonuses, selectedWeekId]
  );

  const standings = useMemo(
    () =>
      calculateTeamStandings(
        dataset.teams,
        dataset.students,
        weekLogs,
        weekBonuses,
        fairnessMode
      ),
    [dataset.teams, dataset.students, weekLogs, weekBonuses, fairnessMode]
  );

  const top3Students = useMemo(
    () =>
      calculateStudentLeaderboard(dataset.students, dataset.teams, weekLogs, "all").slice(
        0,
        3
      ),
    [dataset.students, dataset.teams, weekLogs]
  );

  const todayISO = useMemo(() => getTodayDateISO(), []);

  const todayComboProgress = useMemo(() => {
    return dataset.teams.map((team) => {
      const members = dataset.students.filter(
        (s) => s.is_active && s.team_id === team.id
      );
      const activeMemberIdsToday = new Set(
        dataset.pointLogs
          .filter(
            (l) => l.date === todayISO && l.points > 0 && members.some((m) => m.id === l.student_id)
          )
          .map((l) => l.student_id)
      );
      const unlockedBonus = dataset.teamBonuses.some(
        (b) => b.team_id === team.id && b.date === todayISO
      );

      return {
        team,
        totalMembers: members.length,
        participatedToday: activeMemberIdsToday.size,
        unlockedBonus,
      };
    });
  }, [dataset.teams, dataset.students, dataset.pointLogs, dataset.teamBonuses, todayISO]);

  return (
    <div className="min-h-screen bg-navy-950 text-white selection:bg-blue-500">
      {/* Projector Top Bar */}
      <header className="border-b border-slate-800/90 bg-navy-900/90 px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-navy-800 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                International GoldStars School • MYP 3 Live House Race
              </h1>
              <p className="text-xs font-medium text-slate-400 sm:text-sm">
                Homeroom Projector Display • Auto-updates every 20s {clockText ? `• ${clockText}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select week"
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="rounded-xl border border-slate-700 bg-navy-800 px-4 py-2 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
            >
              {dataset.weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.is_active ? "(Active)" : ""}
                </option>
              ))}
              <option value="all">All-Time Standings</option>
            </select>

            <div className="inline-flex rounded-xl border border-slate-700 bg-navy-950 p-1">
              <button
                type="button"
                onClick={() => setFairnessMode("average")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold transition ${
                  fairnessMode === "average"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Scale className="h-4 w-4" />
                Fair Avg
              </button>
              <button
                type="button"
                onClick={() => setFairnessMode("total")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold transition ${
                  fairnessMode === "total"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="h-4 w-4" />
                Total Pts
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-navy-800 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              title="Refresh Now"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-500"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  Fullscreen
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Projector Grid */}
      <main className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* Giant 3-Team Race Card */}
        <section className="rounded-3xl border border-slate-800 bg-navy-900/90 p-6 shadow-2xl lg:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-400" />
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                3-Team House Standings
              </h2>
            </div>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-300">
              Ranked by {fairnessMode === "average" ? "Fair Average (Pts / Student)" : "Total Points"}
            </span>
          </div>

          <TeamRaceChart
            standings={standings}
            fairnessMode={fairnessMode}
            height={280}
            tvMode={true}
          />

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {standings.map((s) => (
              <div
                key={s.team.id}
                className="relative overflow-hidden rounded-2xl border border-slate-800 bg-navy-950/90 p-5"
              >
                <div
                  className="absolute inset-x-0 top-0 h-2"
                  style={{ backgroundColor: s.team.color }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="rounded-lg px-3 py-1 text-base font-black text-white"
                      style={{ backgroundColor: s.team.color }}
                    >
                      #{s.rank}
                    </span>
                    <h3 className="text-xl font-black text-white">{s.team.name}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400">
                    <Users className="h-4 w-4" />
                    {s.memberCount}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-navy-900 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Fair Average
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      {s.averagePoints.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">pts / student</p>
                  </div>
                  <div className="rounded-xl bg-navy-900 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Points
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">{s.totalPoints}</p>
                    <p className="text-xs text-amber-400">
                      {s.comboCount}x Combo (+{s.bonusPoints})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Split: Top 3 Students + Today's Team Combo Streaks */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top 3 Students */}
          <section className="rounded-3xl border border-slate-800 bg-navy-900/90 p-6 shadow-2xl lg:p-7">
            <div className="flex items-center gap-3">
              <Crown className="h-7 w-7 text-amber-400" />
              <h2 className="text-2xl font-black">Current Top 3 Students</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {top3Students.map((item, idx) => {
                const badgeStyles =
                  idx === 0
                    ? "border-amber-400/50 bg-amber-500/10 text-amber-300"
                    : idx === 1
                    ? "border-slate-400/40 bg-slate-400/10 text-slate-200"
                    : "border-orange-400/40 bg-orange-500/10 text-orange-300";

                return (
                  <div
                    key={item.student.id}
                    className={`flex flex-col justify-between rounded-2xl border p-5 ${badgeStyles}`}
                  >
                    <div>
                      <span className="text-sm font-black uppercase tracking-wider">
                        Rank #{idx + 1}
                      </span>
                      <p className="mt-2 text-2xl font-black text-white">
                        {item.student.name}
                      </p>
                      <span
                        className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: item.team.color }}
                      >
                        {item.team.name}
                      </span>
                    </div>

                    <div className="mt-6">
                      <span className="text-4xl font-black text-white">
                        {item.totalPoints}
                      </span>
                      <span className="ml-1.5 text-sm font-semibold text-slate-300">
                        pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Today's Combo Streaks Tracker */}
          <section className="rounded-3xl border border-slate-800 bg-navy-900/90 p-6 shadow-2xl lg:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-7 w-7 text-amber-400" />
                <div>
                  <h2 className="text-2xl font-black">Today&apos;s Combo Streaks (+5 Bonus)</h2>
                  <p className="text-xs text-slate-400">
                    Unlocked automatically when EVERY active member of a team earns +1 pt today!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {todayComboProgress.map((prog) => {
                const pct =
                  prog.totalMembers > 0
                    ? Math.min(100, Math.round((prog.participatedToday / prog.totalMembers) * 100))
                    : 0;

                return (
                  <div
                    key={prog.team.id}
                    className={`rounded-2xl border p-4 ${
                      prog.unlockedBonus
                        ? "border-amber-400/60 bg-amber-500/15"
                        : "border-slate-800 bg-navy-950/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: prog.team.color }}
                        />
                        <span className="text-lg font-extrabold text-white">
                          {prog.team.name}
                        </span>
                      </div>
                      {prog.unlockedBonus ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-navy-950">
                          <CheckCircle2 className="h-4 w-4" />
                          +5 COMBO UNLOCKED!
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-300">
                          {prog.participatedToday} / {prog.totalMembers} active today
                        </span>
                      )}
                    </div>

                    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: prog.unlockedBonus ? "#fbbf24" : prog.team.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

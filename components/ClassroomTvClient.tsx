"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Crown,
  Maximize2,
  Minimize2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { HubDataset } from "@/types";
import {
  calculateStudentLeaderboard,
  filterByWeek,
  getCurrentDayOfWeek,
} from "@/lib/calculations";
import { SoloRaceChart } from "@/components/TeamRaceChart";
import { getPrizeForPlace } from "@/lib/prizes";

interface ClassroomTvClientProps {
  dataset: HubDataset;
}

export function ClassroomTvClient({ dataset }: ClassroomTvClientProps) {
  const router = useRouter();
  const activeWeek = useMemo(
    () =>
      dataset.weeks.find((w) => w.is_active) ??
      dataset.weeks[dataset.weeks.length - 1],
    [dataset.weeks]
  );

  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    activeWeek?.id ?? "all"
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [clockText, setClockText] = useState<string>("");

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
      // Ignore browser fullscreen restriction
    }
  };

  const weekLogs = useMemo(
    () => filterByWeek(dataset.pointLogs, selectedWeekId),
    [dataset.pointLogs, selectedWeekId]
  );

  const leaderboard = useMemo(
    () => calculateStudentLeaderboard(dataset.students, weekLogs, "all"),
    [dataset.students, weekLogs]
  );

  const top3Students = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  const activeSchedule = useMemo(
    () =>
      dataset.schedules.find((s) => s.is_active) ?? dataset.schedules[0] ?? null,
    [dataset.schedules]
  );

  const todayDay = useMemo(() => getCurrentDayOfWeek(), []);
  const todayLessons = useMemo(
    () =>
      (activeSchedule?.entries ?? [])
        .filter((e) => e.day === todayDay)
        .sort((a, b) => a.period - b.period),
    [activeSchedule, todayDay]
  );

  return (
    <div className="min-h-screen bg-navy-950 text-white selection:bg-blue-500">
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
                International GoldStars School • MYP 3 Live Solo Standings
              </h1>
              <p className="text-xs font-medium text-slate-400 sm:text-sm">
                Homeroom Projector Display • Auto-updates every 20s{" "}
                {clockText ? `• ${clockText}` : ""}
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

      <main className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-800 bg-navy-900/90 p-6 shadow-2xl lg:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-400" />
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Top 10 Solo Leaderboard Race
            </h2>
          </div>

          <SoloRaceChart
            leaderboard={leaderboard}
            maxBars={10}
            height={360}
            tvMode={true}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top 3 Podium */}
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
                    ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-200"
                    : "border-emerald-400/40 bg-emerald-500/10 text-emerald-300";

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
                    </div>

                    <div className="mt-6">
                      <span className="text-4xl font-black text-white">
                        {item.totalPoints}
                      </span>
                      <span className="ml-1.5 text-sm font-semibold text-slate-300">
                        pts
                      </span>
                      {getPrizeForPlace(idx + 1) && (
                        <p className="mt-3 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-bold text-white">
                          {getPrizeForPlace(idx + 1)!.emoji} {getPrizeForPlace(idx + 1)!.prize}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Today's Class Schedule */}
          <section className="rounded-3xl border border-slate-800 bg-navy-900/90 p-6 shadow-2xl lg:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-7 w-7 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-black">
                    {activeSchedule ? activeSchedule.title : `${todayDay} Schedule`}
                  </h2>
                  <p className="text-xs text-slate-400">
                    MYP 3 Class Timetable
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {todayLessons.length > 0 ? (
                <div className="space-y-2.5">
                  {todayLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-navy-950/90 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
                          {lesson.period}
                        </span>
                        <div>
                          <p className="text-base font-extrabold text-white">
                            {lesson.subject}
                          </p>
                          {lesson.roomOrTeacher && (
                            <p className="text-xs text-slate-400">
                              {lesson.roomOrTeacher}
                            </p>
                          )}
                        </div>
                      </div>
                      {lesson.time && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-300">
                          <Clock className="h-4 w-4 text-blue-400" />
                          {lesson.time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : activeSchedule?.image_url ? (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-navy-950 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeSchedule.image_url}
                    alt={activeSchedule.title}
                    className="mx-auto max-h-60 w-auto rounded-xl object-contain"
                  />
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  No schedule uploaded yet. Upload your schedule photo in Admin Console!
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

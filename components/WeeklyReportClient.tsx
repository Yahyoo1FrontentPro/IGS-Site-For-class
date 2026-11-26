"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, GraduationCap, Printer } from "lucide-react";
import { HubDataset } from "@/types";
import {
  calculateMostImproved,
  calculateOverallMVP,
  calculateStudentLeaderboard,
  calculateSubjectChampions,
  calculateTeamStandings,
  filterByWeek,
  formatShortDate,
} from "@/lib/calculations";

interface WeeklyReportClientProps {
  dataset: HubDataset;
  initialWeekId?: string;
}

export function WeeklyReportClient({
  dataset,
  initialWeekId,
}: WeeklyReportClientProps) {
  const defaultWeek = useMemo(() => {
    if (initialWeekId && (initialWeekId === "all" || dataset.weeks.some((w) => w.id === initialWeekId))) {
      return initialWeekId;
    }
    const active = dataset.weeks.find((w) => w.is_active) ?? dataset.weeks[dataset.weeks.length - 1];
    return active?.id ?? "all";
  }, [dataset.weeks, initialWeekId]);

  const [selectedWeekId, setSelectedWeekId] = useState<string>(defaultWeek);

  const selectedWeek = useMemo(
    () => dataset.weeks.find((w) => w.id === selectedWeekId) ?? null,
    [dataset.weeks, selectedWeekId]
  );

  const weekLogs = useMemo(
    () => filterByWeek(dataset.pointLogs, selectedWeekId),
    [dataset.pointLogs, selectedWeekId]
  );

  const weekBonuses = useMemo(
    () => filterByWeek(dataset.teamBonuses, selectedWeekId),
    [dataset.teamBonuses, selectedWeekId]
  );

  const standingsByAverage = useMemo(
    () =>
      calculateTeamStandings(
        dataset.teams,
        dataset.students,
        weekLogs,
        weekBonuses,
        "average"
      ),
    [dataset.teams, dataset.students, weekLogs, weekBonuses]
  );

  const leaderboard = useMemo(
    () =>
      calculateStudentLeaderboard(dataset.students, dataset.teams, weekLogs, "all"),
    [dataset.students, dataset.teams, weekLogs]
  );

  const mvp = useMemo(() => calculateOverallMVP(leaderboard), [leaderboard]);

  const subjectChampions = useMemo(
    () =>
      calculateSubjectChampions(
        dataset.subjects,
        dataset.students,
        dataset.teams,
        weekLogs
      ),
    [dataset.subjects, dataset.students, dataset.teams, weekLogs]
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

  const winningTeam = standingsByAverage[0] && standingsByAverage[0].totalPoints > 0
    ? standingsByAverage[0]
    : null;

  const generatedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 dark:bg-navy-950 print:bg-white print:p-0">
      {/* Screen-only Action Bar */}
      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </Link>

          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <select
              aria-label="Select report week"
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-bold text-slate-800 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-white"
            >
              {dataset.weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatShortDate(w.start_date)} – {formatShortDate(w.end_date)})
                </option>
              ))}
              <option value="all">All-Time Cumulative Report</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-700 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Formal A4 Printable Sheet */}
      <article className="print-container mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-8 text-slate-900 shadow-xl sm:p-10">
        {/* Report Header */}
        <header className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  IB Middle Years Programme • Grade MYP 3
                </p>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  International GoldStars School — MYP 3 Weekly Activity Report
                </h1>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p className="font-bold text-slate-900">
                {selectedWeek ? selectedWeek.name : "All-Time Cumulative"}
              </p>
              {selectedWeek && (
                <p>
                  {formatShortDate(selectedWeek.start_date)} –{" "}
                  {formatShortDate(selectedWeek.end_date)}
                </p>
              )}
              <p className="mt-0.5">Issued: {generatedDate}</p>
            </div>
          </div>
        </header>

        {/* Executive Honors Summary */}
        <section className="print-avoid-break mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-300 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Winning Team (Fair Average)
            </p>
            {winningTeam ? (
              <>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {winningTeam.team.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  <strong>{winningTeam.averagePoints.toFixed(2)}</strong> pts/student •{" "}
                  <strong>{winningTeam.totalPoints}</strong> total pts ({winningTeam.memberCount}{" "}
                  members, {winningTeam.comboCount} combos)
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs italic text-slate-500">No team points recorded yet</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-300 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Overall MVP of the Week
            </p>
            {mvp ? (
              <>
                <p className="mt-1 text-lg font-black text-slate-900">{mvp.student.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {mvp.team.name} • <strong>{mvp.totalPoints} total points</strong>
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs italic text-slate-500">No student points recorded yet</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-300 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Most Improved Student
            </p>
            {!mostImproved.hasPreviousWeek ? (
              <p className="mt-2 text-xs italic text-slate-500">
                Baseline period (unlocks from Week 2)
              </p>
            ) : mostImproved.student && mostImproved.team ? (
              <>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {mostImproved.student.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  +{mostImproved.delta} pts vs {mostImproved.previousWeekName} (
                  {mostImproved.previousPoints} → {mostImproved.currentPoints})
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs italic text-slate-500">
                No positive delta vs {mostImproved.previousWeekName} yet
              </p>
            )}
          </div>
        </section>

        {/* 3-Team Standings Summary Table */}
        <section className="print-avoid-break mt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            1. House Team Standings (Fair Average &amp; Total Score)
          </h2>
          <table className="mt-2 w-full border-collapse border border-slate-300 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-300 px-3 py-2">Rank</th>
                <th className="border border-slate-300 px-3 py-2">House Team</th>
                <th className="border border-slate-300 px-3 py-2 text-center">Members</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Individual Pts</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Combo Bonuses</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Total Points</th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  Fair Average (Pts / Student)
                </th>
              </tr>
            </thead>
            <tbody>
              {standingsByAverage.map((s) => (
                <tr key={s.team.id}>
                  <td className="border border-slate-300 px-3 py-2 font-bold">#{s.rank}</td>
                  <td className="border border-slate-300 px-3 py-2 font-bold">
                    {s.team.short_name} — {s.team.name}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    {s.memberCount}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {s.studentPoints}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    +{s.bonusPoints} ({s.comboCount}x)
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {s.totalPoints}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black">
                    {s.averagePoints.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Subject Champions Table */}
        <section className="print-avoid-break mt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            2. IB MYP 3 Subject Champions
          </h2>
          <table className="mt-2 w-full border-collapse border border-slate-300 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-300 px-3 py-2">Subject / Category</th>
                <th className="border border-slate-300 px-3 py-2">Honor Title</th>
                <th className="border border-slate-300 px-3 py-2">Champion Student</th>
                <th className="border border-slate-300 px-3 py-2">Team</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Subject Score</th>
              </tr>
            </thead>
            <tbody>
              {subjectChampions.map((c) => (
                <tr key={c.subject.id}>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold">
                    {c.subject.name}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">{c.subject.award_title}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold">
                    {c.student ? c.student.name : "—"}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    {c.team ? c.team.name : "—"}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 text-right font-bold">
                    {c.points > 0 ? `${c.points} pts` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Full Student Breakdown Grouped by the 3 Teams */}
        <section className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            3. Full Student Score Breakdown by Team
          </h2>
          <div className="mt-3 space-y-5">
            {dataset.teams.map((team) => {
              const teamStanding = standingsByAverage.find((s) => s.team.id === team.id);
              const teamRows = leaderboard.filter((r) => r.student.team_id === team.id);

              return (
                <div key={team.id} className="print-avoid-break">
                  <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-slate-300 bg-slate-100 px-3 py-2 text-xs">
                    <span className="font-black text-slate-900">
                      {team.short_name} — {team.name} ({teamRows.length} Active Students)
                    </span>
                    {teamStanding && (
                      <span className="font-semibold text-slate-700">
                        Subtotal: {teamStanding.studentPoints} pts | Combos: +
                        {teamStanding.bonusPoints} pts | Total: {teamStanding.totalPoints} pts |
                        Avg: {teamStanding.averagePoints.toFixed(2)} pts/student
                      </span>
                    )}
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="border border-slate-300 px-3 py-1.5">Class Rank</th>
                        <th className="border border-slate-300 px-3 py-1.5">Student Name</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center">
                          Active (+1)
                        </th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center">
                          Star (+2)
                        </th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center">
                          Ace (+3)
                        </th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center">
                          Duty (+1)
                        </th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center">
                          Fair-Play (-1)
                        </th>
                        <th className="border border-slate-300 px-3 py-1.5 text-right">
                          Net Points
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamRows.map((row) => (
                        <tr key={row.student.id}>
                          <td className="border border-slate-300 px-3 py-1.5 font-semibold">
                            #{row.rank}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold">
                            {row.student.name}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center">
                            {row.activeCount || "—"}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center">
                            {row.starCount || "—"}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center">
                            {row.aceCount || "—"}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center">
                            {row.dutyCount || "—"}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center">
                            {row.fairPlayCount || "—"}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-black">
                            {row.totalPoints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

        {/* Official Signatures Footer */}
        <footer className="print-avoid-break mt-10 border-t-2 border-slate-900 pt-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prepared &amp; Verified By
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                Class Leaders: Yahyo &amp; Fazliya
              </p>
              <div className="mt-6 border-b border-slate-400" />
              <p className="mt-1 text-[11px] text-slate-500">
                Signatures — MYP 3 Class Leaders
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Reviewed &amp; Acknowledged By
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                MYP 3 Homeroom Advisor / Coordinator
              </p>
              <div className="mt-6 border-b border-slate-400" />
              <p className="mt-1 text-[11px] text-slate-500">
                Signature &amp; Date — International GoldStars School
              </p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

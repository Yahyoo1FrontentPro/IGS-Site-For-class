"use client";

import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StudentScoreRow } from "@/types";

interface SoloRaceChartProps {
  leaderboard: StudentScoreRow[];
  maxBars?: number;
  height?: number;
  tvMode?: boolean;
}

interface ChartDatum {
  name: string;
  studentName: string;
  value: number;
  rank: number;
  activeCount: number;
  starCount: number;
  aceCount: number;
  dutyCount: number;
  color: string;
  displayLabel: string;
}

function getRankColor(rank: number, hasPoints: boolean): string {
  if (!hasPoints) return "#64748B";
  if (rank === 1) return "#F59E0B"; // Gold
  if (rank === 2) return "#6366F1"; // Indigo
  if (rank === 3) return "#10B981"; // Emerald
  return "#2563EB"; // Royal Blue
}

export function SoloRaceChart({
  leaderboard,
  maxBars = 8,
  height = 290,
  tvMode = false,
}: SoloRaceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const topRows = leaderboard.slice(0, maxBars);

  const data: ChartDatum[] = topRows.map((row) => ({
    name: `#${row.rank} ${row.student.name}`,
    studentName: row.student.name,
    value: Math.max(0, row.totalPoints),
    rank: row.rank,
    activeCount: row.activeCount,
    starCount: row.starCount,
    aceCount: row.aceCount,
    dutyCount: row.dutyCount,
    color: getRankColor(row.rank, row.totalPoints > 0),
    displayLabel: `${row.totalPoints} pts`,
  }));

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full animate-pulse rounded-xl bg-slate-100/80 dark:bg-navy-800/50"
      />
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 5);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 8,
            right: tvMode ? 110 : 85,
            left: tvMode ? 16 : 8,
            bottom: 8,
          }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={
              tvMode ? "rgba(148, 163, 184, 0.18)" : "rgba(148, 163, 184, 0.25)"
            }
          />
          <XAxis
            type="number"
            domain={[0, Math.ceil(maxValue * 1.18)]}
            tick={{
              fill: tvMode ? "#cbd5e1" : "#64748b",
              fontSize: tvMode ? 14 : 12,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={tvMode ? 190 : 150}
            tick={{
              fill: tvMode ? "#f8fafc" : "#475569",
              fontSize: tvMode ? 16 : 12,
              fontWeight: 700,
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const item = payload[0].payload as ChartDatum;
              return (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-navy-900">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Total Score:{" "}
                    <strong className="text-slate-900 dark:text-white">
                      {item.value} pts
                    </strong>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Active ×{item.activeCount} • Star ×{item.starCount} • Ace ×
                    {item.aceCount} • Duty ×{item.dutyCount}
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 10, 10, 0]}
            isAnimationActive={true}
            animationDuration={700}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="displayLabel"
              position="right"
              style={{
                fill: tvMode ? "#f1f5f9" : "#475569",
                fontSize: tvMode ? 14 : 12,
                fontWeight: 700,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

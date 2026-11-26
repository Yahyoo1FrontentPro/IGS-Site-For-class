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
import { FairnessMode, TeamStanding } from "@/types";

interface TeamRaceChartProps {
  standings: TeamStanding[];
  fairnessMode: FairnessMode;
  height?: number;
  tvMode?: boolean;
}

interface ChartDatum {
  name: string;
  shortName: string;
  value: number;
  averagePoints: number;
  totalPoints: number;
  memberCount: number;
  comboCount: number;
  color: string;
  rank: number;
  displayLabel: string;
}

export function TeamRaceChart({
  standings,
  fairnessMode,
  height = 240,
  tvMode = false,
}: TeamRaceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data: ChartDatum[] = standings.map((s) => {
    const val = fairnessMode === "average" ? s.averagePoints : s.totalPoints;
    const displayLabel =
      fairnessMode === "average"
        ? `${s.averagePoints.toFixed(2)} avg (${s.totalPoints} pts)`
        : `${s.totalPoints} pts (${s.averagePoints.toFixed(2)} avg)`;

    return {
      name: `#${s.rank} ${s.team.name}`,
      shortName: s.team.short_name,
      value: Math.max(0, val),
      averagePoints: s.averagePoints,
      totalPoints: s.totalPoints,
      memberCount: s.memberCount,
      comboCount: s.comboCount,
      color: s.team.color,
      rank: s.rank,
      displayLabel,
    };
  });

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-xl bg-slate-100/80 dark:bg-navy-800/50 animate-pulse"
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
            right: tvMode ? 170 : 140,
            left: tvMode ? 20 : 8,
            bottom: 8,
          }}
          barCategoryGap={tvMode ? "24%" : "28%"}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={tvMode ? "rgba(148, 163, 184, 0.18)" : "rgba(148, 163, 184, 0.25)"}
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
            width={tvMode ? 220 : 175}
            tick={{
              fill: tvMode ? "#f8fafc" : "#64748b",
              fontSize: tvMode ? 17 : 13,
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
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      Fair Average:{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {item.averagePoints.toFixed(2)} pts / student
                      </strong>
                    </p>
                    <p>
                      Total Points:{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {item.totalPoints} pts
                      </strong>{" "}
                      ({item.memberCount} active members)
                    </p>
                    <p>
                      Combo Streaks:{" "}
                      <strong className="text-amber-600 dark:text-amber-400">
                        {item.comboCount}x (+{item.comboCount * 5} pts)
                      </strong>
                    </p>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 10, 10, 0]}
            isAnimationActive={true}
            animationDuration={750}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="displayLabel"
              position="right"
              style={{
                fill: tvMode ? "#f1f5f9" : "#475569",
                fontSize: tvMode ? 15 : 12,
                fontWeight: 700,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

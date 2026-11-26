"use client";

import React, { useState } from "react";
import { Crown, Loader2, Lock, RefreshCw, Unlock, Vote } from "lucide-react";
import { ElectionState } from "@/types";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminElectionPanel({ initialState }: { initialState: ElectionState }) {
  const [state, setState] = useState<ElectionState>(initialState);
  const [title, setTitle] = useState("Weekly Class Leader Vote");
  const [currentLeader, setCurrentLeader] = useState("Yahyo");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const call = async (method: "GET" | "POST" | "PATCH", body?: object) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/elections", {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json()) as { state?: ElectionState; winner?: string; error?: string };
      if (!res.ok || !data.state) {
        setMessage({ type: "err", text: data.error ?? "Request failed." });
        return;
      }
      setState(data.state);
      if (method === "POST") setMessage({ type: "ok", text: "Voting is now OPEN. Write it on the whiteboard!" });
      if (method === "PATCH") setMessage({ type: "ok", text: `Voting closed. Result: ${data.winner}` });
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setBusy(false);
    }
  };

  const open = state.openElection;
  const liveTotal = state.openResults?.reduce((s, r) => s + r.votes, 0) ?? 0;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Vote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Class Leader Voting</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Students can only vote while YOU open the vote. Each account votes once per round.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => call("GET")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-navy-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            Refresh results
          </button>
        </div>

        {message && (
          <p
            className={`mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
              message.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            {message.text}
          </p>
        )}

        {open ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div>
                <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  <Unlock className="mr-1 inline h-4 w-4" />
                  OPEN: {open.title}
                </p>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  Current leader: {open.current_leader} • Opened {formatDate(open.created_at)} •{" "}
                  {state.openTotalVotes} votes
                </p>
              </div>
              <button
                type="button"
                onClick={() => call("PATCH", { electionId: open.id })}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Close Voting &amp; Show Result
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live results (only you see these)</h3>
              {state.openResults && state.openResults.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {state.openResults.map((r) => {
                    const pct = liveTotal > 0 ? Math.round((r.votes / liveTotal) * 100) : 0;
                    return (
                      <div key={r.candidate} className="text-xs">
                        <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                          <span>{r.label}</span>
                          <span>
                            {r.votes} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">No votes yet.</p>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              call("POST", { title, currentLeader });
            }}
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vote title"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
            <input
              type="text"
              required
              value={currentLeader}
              onChange={(e) => setCurrentLeader(e.target.value)}
              placeholder="Current leader name"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              Open Voting Now
            </button>
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Past Votes</h3>
        {state.history.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">No votes held yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {state.history.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs dark:border-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{h.title}</p>
                  <p className="text-slate-500">Closed {formatDate(h.closed_at)} • Leader before: {h.current_leader}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Crown className="h-3.5 w-3.5" />
                  {h.winner}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

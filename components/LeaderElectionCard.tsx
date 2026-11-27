"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Crown, Loader2, Lock, LogIn, Vote } from "lucide-react";
import { ElectionState, SessionUser } from "@/types";
import { useLanguage } from "@/components/LanguageProvider";

const KEEP_TOKEN = "__KEEP__";

interface LeaderElectionCardProps {
  initialState: ElectionState;
  sessionUser: SessionUser | null;
}

export function LeaderElectionCard({
  initialState,
  sessionUser,
}: LeaderElectionCardProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<ElectionState>(initialState);
  const [choice, setChoice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = state.openElection;

  const submitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!open || !choice) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/elections/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId: open.id, candidate: choice }),
      });
      const data = (await res.json()) as {
        state?: ElectionState;
        error?: string;
      };
      if (!res.ok || !data.state) {
        setError(data.error ?? "Could not submit your vote.");
        return;
      }
      setState(data.state);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open && !state.latestClosed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm dark:border-slate-800 dark:bg-navy-900">
        <Lock className="h-5 w-5 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">
            {t.voteTitle}:
          </strong>{" "}
          {t.voteClosedBanner}
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm sm:p-6 dark:border-indigo-800/50 dark:from-indigo-950/30 dark:via-navy-900 dark:to-navy-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {open ? open.title : t.voteTitle}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            open
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300"
          }`}
        >
          {open
            ? `${t.voteOpenStatus} • ${state.openTotalVotes} ${t.voteVotesSoFar}`
            : t.voteClosedStatus}
        </span>
      </div>

      {open ? (
        <div className="mt-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {t.voteCurrentLeader} <strong>{open.current_leader}</strong>.{" "}
            {t.voteInstructions}
          </p>

          {!sessionUser ? (
            <Link
              href="/login?next=/vote"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
            >
              <LogIn className="h-4 w-4" />
              {t.voteLoginBtn}
            </Link>
          ) : state.hasVoted ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              {t.voteThankYou} {state.myVote}
            </div>
          ) : (
            <form onSubmit={submitVote} className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 dark:border-indigo-800/60 dark:bg-navy-950 dark:text-white">
                <input
                  type="radio"
                  name="leader-vote"
                  checked={choice === KEEP_TOKEN}
                  onChange={() => setChoice(KEEP_TOKEN)}
                />
                <Crown className="h-4 w-4 text-amber-500" />
                {t.voteKeepCurrent} ({open.current_leader})
              </label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {state.candidates.map((name) => (
                  <label
                    key={name}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      choice === name
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-navy-950 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="leader-vote"
                      checked={choice === name}
                      onChange={() => setChoice(name)}
                    />
                    {name}
                  </label>
                ))}
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!choice || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Vote className="h-4 w-4" />
                )}
                {t.voteSubmitBtn}
              </button>
            </form>
          )}
        </div>
      ) : (
        state.latestClosed && (
          <div className="mt-4">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {t.voteLastResult} ({state.latestClosed.title}):{" "}
              <strong className="text-indigo-700 dark:text-indigo-300">
                {state.latestClosed.winner}
              </strong>
            </p>
            {state.latestClosedResults.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {state.latestClosedResults.map((r) => {
                  const total = state.latestClosedResults.reduce(
                    (s, x) => s + x.votes,
                    0
                  );
                  const pct =
                    total > 0 ? Math.round((r.votes / total) * 100) : 0;
                  return (
                    <div key={r.candidate} className="text-xs">
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>{r.label}</span>
                        <span>
                          {r.votes} {t.voteVotesWord} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t.voteNextHint}
            </p>
          </div>
        )
      )}
    </section>
  );
}

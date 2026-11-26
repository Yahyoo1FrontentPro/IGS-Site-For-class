import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getElectionState } from "@/lib/elections";
import { LeaderElectionCard } from "@/components/LeaderElectionCard";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  const sessionUser = getSessionUser();
  const electionState = await getElectionState(sessionUser);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-navy-900">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Activity Hub
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <LeaderElectionCard initialState={electionState} sessionUser={sessionUser} />
      </main>
    </div>
  );
}

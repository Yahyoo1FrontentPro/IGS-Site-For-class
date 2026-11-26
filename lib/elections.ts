import {
  ElectionResult,
  ElectionState,
  LeaderElection,
  LeaderVote,
  SessionUser,
} from "@/types";
import { readLocalStore } from "@/lib/local-store";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase";

/** Special ballot option meaning "keep the current class leader". */
export const KEEP_TOKEN = "__KEEP__";

export function candidateLabel(candidate: string, currentLeader: string): string {
  return candidate === KEEP_TOKEN
    ? `Keep current leader (${currentLeader})`
    : candidate;
}

function mapElection(row: Record<string, unknown>): LeaderElection {
  return {
    id: String(row.id),
    title: String(row.title ?? "Class Leader Vote"),
    current_leader: String(row.current_leader ?? ""),
    status: row.status === "closed" ? "closed" : "open",
    winner: typeof row.winner === "string" ? row.winner : null,
    created_at: String(row.created_at ?? ""),
    closed_at: typeof row.closed_at === "string" ? row.closed_at : null,
  };
}

export async function loadActiveStudentNames(): Promise<string[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("students")
        .select("name, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((r) => String(r.name));
      }
    } catch {
      // fall through to local store
    }
  }
  return readLocalStore()
    .students.filter((s) => s.is_active)
    .map((s) => s.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function loadElectionsAndVotes(): Promise<{
  elections: LeaderElection[];
  votes: LeaderVote[];
  usingSupabase: boolean;
}> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: eRows, error } = await supabase
        .from("leader_elections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && eRows) {
        const elections = eRows.map((r) =>
          mapElection(r as Record<string, unknown>)
        );
        const ids = elections.map((e) => e.id);
        let votes: LeaderVote[] = [];

        if (ids.length > 0) {
          const { data: vRows } = await supabase
            .from("leader_votes")
            .select("id, election_id, voter_username_lower, candidate, created_at")
            .in("election_id", ids);
          votes = (vRows ?? []).map((v) => ({
            id: String(v.id),
            election_id: String(v.election_id),
            voter_username_lower: String(v.voter_username_lower),
            candidate: String(v.candidate),
            created_at: String(v.created_at),
          }));
        }

        return { elections, votes, usingSupabase: true };
      }
    } catch {
      // Fall back to local store if leader_elections table is not yet created in Supabase
    }
  }

  const store = readLocalStore();
  return {
    elections: [...store.elections].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    votes: store.votes,
    usingSupabase: false,
  };
}

export function tallyVotes(
  election: LeaderElection,
  votes: LeaderVote[]
): ElectionResult[] {
  const counts = new Map<string, number>();
  for (const v of votes) {
    if (v.election_id !== election.id) continue;
    counts.set(v.candidate, (counts.get(v.candidate) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([candidate, count]) => ({
      candidate,
      label: candidateLabel(candidate, election.current_leader),
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));
}

export function computeWinner(
  results: ElectionResult[],
  currentLeader: string
): string {
  if (results.length === 0) return `${currentLeader} (stays — no votes cast)`;
  const top = results[0];
  const tied = results.filter((r) => r.votes === top.votes);
  if (tied.length > 1) return `${currentLeader} (stays — tie vote)`;
  if (top.candidate === KEEP_TOKEN) return `${currentLeader} (stays as Class Leader)`;
  return `${top.candidate} (elected new Class Leader)`;
}

export async function getElectionState(
  user: SessionUser | null
): Promise<ElectionState> {
  const [{ elections, votes }, candidates] = await Promise.all([
    loadElectionsAndVotes(),
    loadActiveStudentNames(),
  ]);

  const openElection = elections.find((e) => e.status === "open") ?? null;
  const closed = elections.filter((e) => e.status === "closed");
  const latestClosed = closed[0] ?? null;

  const openVotes = openElection
    ? votes.filter((v) => v.election_id === openElection.id)
    : [];

  const voterKey = user?.username.toLowerCase() ?? null;
  const myVoteRow =
    voterKey && openElection
      ? openVotes.find((v) => v.voter_username_lower === voterKey) ?? null
      : null;

  return {
    openElection,
    openTotalVotes: openVotes.length,
    openResults:
      openElection && user?.role === "admin"
        ? tallyVotes(openElection, votes)
        : null,
    hasVoted: Boolean(myVoteRow),
    myVote: myVoteRow
      ? candidateLabel(myVoteRow.candidate, openElection!.current_leader)
      : null,
    latestClosed,
    latestClosedResults: latestClosed ? tallyVotes(latestClosed, votes) : [],
    history: closed,
    candidates,
  };
}

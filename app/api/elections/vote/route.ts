import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  KEEP_TOKEN,
  getElectionState,
  loadActiveStudentNames,
  loadElectionsAndVotes,
} from "@/lib/elections";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to vote." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      electionId?: unknown;
      candidate?: unknown;
    };
    const electionId =
      typeof body.electionId === "string" ? body.electionId.trim() : "";
    const candidate =
      typeof body.candidate === "string" ? body.candidate.trim() : "";

    if (!electionId || !candidate) {
      return NextResponse.json(
        { error: "Please choose an option." },
        { status: 400 }
      );
    }

    const [{ elections, votes, usingSupabase }, candidates] = await Promise.all([
      loadElectionsAndVotes(),
      loadActiveStudentNames(),
    ]);

    const election = elections.find((e) => e.id === electionId);
    if (!election || election.status !== "open") {
      return NextResponse.json(
        {
          error:
            "Voting is closed right now. Wait until the Class Leader announces it on the whiteboard.",
        },
        { status: 400 }
      );
    }

    if (candidate !== KEEP_TOKEN && !candidates.includes(candidate)) {
      return NextResponse.json({ error: "Invalid candidate." }, { status: 400 });
    }

    const voterKey = user.username.toLowerCase();
    if (
      votes.some(
        (v) =>
          v.election_id === electionId && v.voter_username_lower === voterKey
      )
    ) {
      return NextResponse.json(
        { error: "You have already voted in this round." },
        { status: 409 }
      );
    }

    let savedInSupabase = false;
    if (isSupabaseAdminConfigured() && usingSupabase) {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("leader_votes").insert({
        election_id: electionId,
        voter_username_lower: voterKey,
        candidate,
      });
      if (!error) {
        savedInSupabase = true;
      } else if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already voted in this round." },
          { status: 409 }
        );
      }
    }

    if (!savedInSupabase) {
      const store = readLocalStore();
      store.votes.push({
        id: generateId(),
        election_id: electionId,
        voter_username_lower: voterKey,
        candidate,
        created_at: new Date().toISOString(),
      });
      writeLocalStore(store);
    }

    const state = await getElectionState(user);
    return NextResponse.json({ voted: true, state });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  computeWinner,
  getElectionState,
  loadElectionsAndVotes,
  tallyVotes,
} from "@/lib/elections";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function requireAdmin() {
  const user = getSessionUser();
  return user && user.role === "admin" ? user : null;
}

export async function GET() {
  const admin = requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const state = await getElectionState(admin);
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      title?: unknown;
      currentLeader?: unknown;
    };
    const title =
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim()
        : "Weekly Class Leader Vote";
    const currentLeader =
      typeof body.currentLeader === "string" ? body.currentLeader.trim() : "";

    if (currentLeader.length < 2) {
      return NextResponse.json(
        { error: "Please enter the current class leader's name." },
        { status: 400 }
      );
    }

    const { elections, usingSupabase } = await loadElectionsAndVotes();
    if (elections.some((e) => e.status === "open")) {
      return NextResponse.json(
        { error: "A vote is already open. Close it before opening a new one." },
        { status: 409 }
      );
    }

    let savedInSupabase = false;
    if (isSupabaseAdminConfigured() && usingSupabase) {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("leader_elections").insert({
        title,
        current_leader: currentLeader,
        status: "open",
      });
      if (!error) {
        savedInSupabase = true;
      }
    }

    if (!savedInSupabase) {
      const store = readLocalStore();
      store.elections.unshift({
        id: generateId(),
        title,
        current_leader: currentLeader,
        status: "open",
        winner: null,
        created_at: new Date().toISOString(),
        closed_at: null,
      });
      writeLocalStore(store);
    }

    const state = await getElectionState(admin);
    return NextResponse.json({ state });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { electionId?: unknown };
    const electionId =
      typeof body.electionId === "string" ? body.electionId.trim() : "";

    const { elections, votes, usingSupabase } = await loadElectionsAndVotes();
    const election = elections.find((e) => e.id === electionId);
    if (!election || election.status !== "open") {
      return NextResponse.json({ error: "No open vote found." }, { status: 404 });
    }

    const winner = computeWinner(
      tallyVotes(election, votes),
      election.current_leader
    );
    const closedAt = new Date().toISOString();

    let updatedInSupabase = false;
    if (isSupabaseAdminConfigured() && usingSupabase) {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("leader_elections")
        .update({ status: "closed", winner, closed_at: closedAt })
        .eq("id", election.id);
      if (!error) {
        updatedInSupabase = true;
      }
    }

    if (!updatedInSupabase) {
      const store = readLocalStore();
      const target = store.elections.find((e) => e.id === election.id);
      if (target) {
        target.status = "closed";
        target.winner = winner;
        target.closed_at = closedAt;
      }
      writeLocalStore(store);
    }

    const state = await getElectionState(admin);
    return NextResponse.json({ state, winner });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

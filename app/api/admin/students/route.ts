import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase Service Role Key is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as { name?: unknown; teamId?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";

    if (name.length < 2 || !teamId) {
      return NextResponse.json(
        { error: "Student name (at least 2 characters) and team are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("students")
      .insert({
        name,
        team_id: teamId,
        is_active: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to add student." },
        { status: 500 }
      );
    }

    return NextResponse.json({ student: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase Service Role Key is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as {
      studentId?: unknown;
      name?: unknown;
      teamId?: unknown;
      isActive?: unknown;
    };

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      updates.name = body.name.trim();
    }
    if (typeof body.teamId === "string" && body.teamId.trim().length > 0) {
      updates.team_id = body.teamId.trim();
    }
    if (typeof body.isActive === "boolean") {
      updates.is_active = body.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", studentId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update student." },
        { status: 500 }
      );
    }

    return NextResponse.json({ student: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

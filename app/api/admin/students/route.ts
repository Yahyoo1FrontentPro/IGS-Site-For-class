import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_STUDENT_PASSWORD_HASH,
  isAdminAuthenticated,
} from "@/lib/auth";
import {
  generateId,
  readLocalStore,
  writeLocalStore,
} from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Student name (at least 2 characters) is required." },
        { status: 400 }
      );
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      let { data, error } = await supabase
        .from("students")
        .insert({
          name,
          is_active: true,
        })
        .select("id, name, is_active, created_at")
        .single();

      // Backward compatibility if legacy team_id column still exists on students in Supabase
      if (error && error.message.includes("team_id")) {
        const { data: firstTeam } = await supabase
          .from("teams")
          .select("id")
          .limit(1)
          .maybeSingle();
        const retry = await supabase
          .from("students")
          .insert({
            name,
            team_id: firstTeam?.id,
            is_active: true,
          })
          .select("id, name, is_active, created_at")
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to add student." },
          { status: 500 }
        );
      }

      const safeUsername = name.replace(/\s+/g, "_");
      const { data: existingAcc } = await supabase
        .from("app_users")
        .select("id")
        .eq("username_lower", safeUsername.toLowerCase())
        .maybeSingle();

      if (!existingAcc) {
        await supabase.from("app_users").insert({
          username: safeUsername,
          password_hash: DEFAULT_STUDENT_PASSWORD_HASH,
          role: "student",
        });
      }

      return NextResponse.json({ student: data });
    }

    const store = readLocalStore();
    const created = {
      id: generateId(),
      name,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    store.students.push(created);

    const safeUsername = name.replace(/\s+/g, "_");
    if (!store.appUsers.some((u) => u.username_lower === safeUsername.toLowerCase())) {
      store.appUsers.push({
        id: generateId(),
        username: safeUsername,
        username_lower: safeUsername.toLowerCase(),
        phone: null,
        phone_normalized: null,
        password_hash: DEFAULT_STUDENT_PASSWORD_HASH,
        role: "student",
        created_at: new Date().toISOString(),
      });
    }

    writeLocalStore(store);
    return NextResponse.json({ student: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      studentId?: unknown;
      name?: unknown;
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
    if (typeof body.isActive === "boolean") {
      updates.is_active = body.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", studentId)
        .select("id, name, is_active, created_at")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to update student." },
          { status: 500 }
        );
      }

      return NextResponse.json({ student: data });
    }

    const store = readLocalStore();
    const target = store.students.find((s) => s.id === studentId);
    if (!target) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }
    if (typeof updates.name === "string") target.name = updates.name;
    if (typeof updates.is_active === "boolean") target.is_active = updates.is_active;
    writeLocalStore(store);

    return NextResponse.json({ student: target });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

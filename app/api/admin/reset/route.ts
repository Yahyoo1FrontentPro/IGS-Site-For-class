import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { getTodayDateISO } from "@/lib/calculations";

/**
 * Resets the site back to its clean starting state (0 points, 0 combo streaks, fresh Week 1)
 * WITHOUT ever deleting students, teams, subjects, or user accounts.
 */
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      confirmText?: unknown;
    };

    const confirmText =
      typeof body.confirmText === "string"
        ? body.confirmText.trim().toUpperCase()
        : "";

    if (confirmText !== "RESET") {
      return NextResponse.json(
        { error: "Please type RESET to confirm." },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateISO();
    const endDt = new Date();
    endDt.setDate(endDt.getDate() + 6);
    const endDateStr = endDt.toISOString().slice(0, 10);

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      // 1. Clear ONLY score logs and combo bonuses (NEVER touch students, teams, subjects, or app_users!)
      const [delLogs, delBonuses] = await Promise.all([
        supabase
          .from("point_logs")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase
          .from("team_bonuses")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"),
      ]);

      if (delLogs.error) {
        return NextResponse.json({ error: delLogs.error.message }, { status: 500 });
      }
      if (delBonuses.error) {
        return NextResponse.json({ error: delBonuses.error.message }, { status: 500 });
      }

      // 2. Return weeks back to clean Week 1
      await supabase
        .from("weeks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { data: freshWeek, error: weekErr } = await supabase
        .from("weeks")
        .insert({
          week_number: 1,
          name: "Week 1",
          start_date: todayStr,
          end_date: endDateStr,
          is_active: true,
        })
        .select("*")
        .single();

      if (weekErr) {
        return NextResponse.json({ error: weekErr.message }, { status: 500 });
      }

      // 3. Ensure all existing students & subjects are active/visible just like initial state
      await Promise.all([
        supabase
          .from("students")
          .update({ is_active: true })
          .neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase
          .from("subjects")
          .update({ is_hidden: false })
          .neq("id", "00000000-0000-0000-0000-000000000000"),
      ]);

      return NextResponse.json({
        cleared: true,
        activeWeek: freshWeek,
      });
    }

    // Local Store Fallback — keep all students, teams, subjects & accounts intact
    const store = readLocalStore();
    store.pointLogs = [];
    store.teamBonuses = [];
    store.students = store.students.map((s) => ({ ...s, is_active: true }));
    store.subjects = store.subjects.map((sub) => ({ ...sub, is_hidden: false }));

    const freshWeek = {
      id: generateId(),
      week_number: 1,
      name: "Week 1",
      start_date: todayStr,
      end_date: endDateStr,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    store.weeks = [freshWeek];

    writeLocalStore(store);

    return NextResponse.json({
      cleared: true,
      activeWeek: freshWeek,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

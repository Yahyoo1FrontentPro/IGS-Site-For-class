import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSeedPreviewDataset } from "@/lib/seed-preview";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { getTodayDateISO } from "@/lib/calculations";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      mode?: unknown;
      confirmText?: unknown;
    };

    const confirmText =
      typeof body.confirmText === "string" ? body.confirmText.trim().toUpperCase() : "";
    if (confirmText !== "RESET") {
      return NextResponse.json(
        { error: 'Please type RESET to confirm clearing all data.' },
        { status: 400 }
      );
    }

    // mode: "scores" (default: clears all points, combos, and resets weeks to Week 1)
    // mode: "factory" (also restores default 19 students & 7 subjects)
    const mode = body.mode === "factory" ? "factory" : "scores";

    const todayStr = getTodayDateISO();
    const endDt = new Date();
    endDt.setDate(endDt.getDate() + 6);
    const endDateStr = endDt.toISOString().slice(0, 10);

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      // 1. Delete all point_logs and team_bonuses
      const [delLogs, delBonuses] = await Promise.all([
        supabase.from("point_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("team_bonuses").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      ]);

      if (delLogs.error) {
        return NextResponse.json({ error: delLogs.error.message }, { status: 500 });
      }
      if (delBonuses.error) {
        return NextResponse.json({ error: delBonuses.error.message }, { status: 500 });
      }

      // 2. Reset weeks back to fresh active Week 1
      await supabase.from("weeks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

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

      if (mode === "factory") {
        // Restore all subjects to visible and students to active
        await Promise.all([
          supabase
            .from("subjects")
            .update({ is_hidden: false })
            .neq("id", "00000000-0000-0000-0000-000000000000"),
          supabase
            .from("students")
            .update({ is_active: true })
            .neq("id", "00000000-0000-0000-0000-000000000000"),
        ]);
      }

      return NextResponse.json({
        cleared: true,
        mode,
        activeWeek: freshWeek,
      });
    }

    // Local Store Fallback
    const store = readLocalStore();
    store.pointLogs = [];
    store.teamBonuses = [];
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

    if (mode === "factory") {
      const seed = getSeedPreviewDataset();
      store.teams = seed.teams;
      store.students = seed.students;
      store.subjects = seed.subjects;
    }

    writeLocalStore(store);

    return NextResponse.json({
      cleared: true,
      mode,
      activeWeek: freshWeek,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

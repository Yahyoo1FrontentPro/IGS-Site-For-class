import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
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
    const body = (await req.json()) as {
      name?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      makeActive?: unknown;
    };

    const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
    const endDate = typeof body.endDate === "string" ? body.endDate.trim() : "";
    const makeActive = body.makeActive !== false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: "Valid start and end dates (YYYY-MM-DD) are required." },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be on or after start date." },
        { status: 400 }
      );
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { data: latestWeek } = await supabase
        .from("weeks")
        .select("week_number")
        .order("week_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextWeekNumber = (latestWeek?.week_number ?? 0) + 1;
      const customName =
        typeof body.name === "string" && body.name.trim().length > 0
          ? body.name.trim()
          : `Week ${nextWeekNumber}`;

      if (makeActive) {
        await supabase.from("weeks").update({ is_active: false }).eq("is_active", true);
      }

      const { data: created, error } = await supabase
        .from("weeks")
        .insert({
          week_number: nextWeekNumber,
          name: customName,
          start_date: startDate,
          end_date: endDate,
          is_active: makeActive,
        })
        .select("*")
        .single();

      if (error || !created) {
        return NextResponse.json(
          { error: error?.message ?? "Could not create week." },
          { status: 500 }
        );
      }

      return NextResponse.json({ week: created });
    }

    const store = readLocalStore();
    const nextWeekNumber =
      Math.max(0, ...store.weeks.map((w) => w.week_number)) + 1;
    const customName =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : `Week ${nextWeekNumber}`;

    if (makeActive) {
      store.weeks = store.weeks.map((w) => ({ ...w, is_active: false }));
    }

    const created = {
      id: generateId(),
      week_number: nextWeekNumber,
      name: customName,
      start_date: startDate,
      end_date: endDate,
      is_active: makeActive,
      created_at: new Date().toISOString(),
    };
    store.weeks.push(created);
    writeLocalStore(store);

    return NextResponse.json({ week: created });
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
    const body = (await req.json()) as { weekId?: unknown };
    const weekId = typeof body.weekId === "string" ? body.weekId.trim() : "";

    if (!weekId) {
      return NextResponse.json({ error: "Missing weekId." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      await supabase.from("weeks").update({ is_active: false }).eq("is_active", true);

      const { data: updated, error } = await supabase
        .from("weeks")
        .update({ is_active: true })
        .eq("id", weekId)
        .select("*")
        .single();

      if (error || !updated) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to activate week." },
          { status: 500 }
        );
      }

      return NextResponse.json({ week: updated });
    }

    const store = readLocalStore();
    const found = store.weeks.find((w) => w.id === weekId);
    if (!found) {
      return NextResponse.json({ error: "Week not found." }, { status: 404 });
    }
    store.weeks = store.weeks.map((w) => ({ ...w, is_active: w.id === weekId }));
    writeLocalStore(store);

    return NextResponse.json({ week: { ...found, is_active: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

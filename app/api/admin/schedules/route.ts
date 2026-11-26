import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  generateId,
  readLocalStore,
  writeLocalStore,
} from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { ClassSchedule, ScheduleLesson } from "@/types";

function sanitizeEntries(raw: unknown): ScheduleLesson[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ScheduleLesson[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const day = String(obj.day ?? "Monday") as ScheduleLesson["day"];
    const period = Number(obj.period ?? 1);
    const time = String(obj.time ?? "").trim();
    const subject = String(obj.subject ?? "").trim();
    const roomOrTeacher =
      typeof obj.roomOrTeacher === "string" && obj.roomOrTeacher.trim().length > 0
        ? obj.roomOrTeacher.trim()
        : undefined;

    if (!subject) continue;

    cleaned.push({
      id: typeof obj.id === "string" && obj.id ? obj.id : generateId(),
      day,
      period: Number.isFinite(period) && period > 0 ? period : 1,
      time,
      subject,
      roomOrTeacher,
    });
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      title?: unknown;
      imageUrl?: unknown;
      entries?: unknown;
      makeActive?: unknown;
    };

    const title =
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim()
        : "MYP 3 Weekly Schedule";
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : null;
    const entries = sanitizeEntries(body.entries);
    const makeActive = body.makeActive !== false;

    if (!imageUrl && entries.length === 0) {
      return NextResponse.json(
        { error: "Please upload a schedule photo or add at least one lesson row." },
        { status: 400 }
      );
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      if (makeActive) {
        await supabase
          .from("schedules")
          .update({ is_active: false })
          .eq("is_active", true);
      }

      const { data: created, error } = await supabase
        .from("schedules")
        .insert({
          title,
          image_url: imageUrl,
          entries,
          is_active: makeActive,
        })
        .select("*")
        .single();

      if (!error && created) {
        return NextResponse.json({
          schedule: {
            id: String(created.id),
            title: String(created.title),
            image_url: (created.image_url as string | null) ?? null,
            entries: Array.isArray(created.entries) ? created.entries : [],
            is_active: Boolean(created.is_active),
            created_at: String(created.created_at),
          } as ClassSchedule,
        });
      }
      // If schedules table hasn't been created in Supabase yet, fall through to local store
    }

    const store = readLocalStore();
    if (makeActive) {
      store.schedules = store.schedules.map((s) => ({ ...s, is_active: false }));
    }

    const created: ClassSchedule = {
      id: generateId(),
      title,
      image_url: imageUrl,
      entries,
      is_active: makeActive,
      created_at: new Date().toISOString(),
    };
    store.schedules.unshift(created);
    writeLocalStore(store);

    return NextResponse.json({ schedule: created });
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
      scheduleId?: unknown;
      makeActive?: unknown;
      title?: unknown;
      imageUrl?: unknown;
      entries?: unknown;
    };

    const scheduleId =
      typeof body.scheduleId === "string" ? body.scheduleId.trim() : "";
    if (!scheduleId) {
      return NextResponse.json({ error: "Missing scheduleId." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      if (body.makeActive === true) {
        await supabase
          .from("schedules")
          .update({ is_active: false })
          .eq("is_active", true);
      }

      const updates: Record<string, unknown> = {};
      if (body.makeActive === true) updates.is_active = true;
      if (typeof body.title === "string" && body.title.trim().length > 0) {
        updates.title = body.title.trim();
      }
      if (body.imageUrl !== undefined) {
        updates.image_url =
          typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
            ? body.imageUrl.trim()
            : null;
      }
      if (body.entries !== undefined) {
        updates.entries = sanitizeEntries(body.entries);
      }

      const { data: updated, error } = await supabase
        .from("schedules")
        .update(updates)
        .eq("id", scheduleId)
        .select("*")
        .single();

      if (error || !updated) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to update schedule." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        schedule: {
          id: String(updated.id),
          title: String(updated.title),
          image_url: (updated.image_url as string | null) ?? null,
          entries: Array.isArray(updated.entries) ? updated.entries : [],
          is_active: Boolean(updated.is_active),
          created_at: String(updated.created_at),
        } as ClassSchedule,
      });
    }

    const store = readLocalStore();
    const target = store.schedules.find((s) => s.id === scheduleId);
    if (!target) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }

    if (body.makeActive === true) {
      store.schedules.forEach((s) => {
        s.is_active = false;
      });
      target.is_active = true;
    }
    if (typeof body.title === "string" && body.title.trim().length > 0) {
      target.title = body.title.trim();
    }
    if (body.imageUrl !== undefined) {
      target.image_url =
        typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
          ? body.imageUrl.trim()
          : null;
    }
    if (body.entries !== undefined) {
      target.entries = sanitizeEntries(body.entries);
    }

    writeLocalStore(store);
    return NextResponse.json({ schedule: target });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing schedule id." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ deleted: true });
    }

    const store = readLocalStore();
    store.schedules = store.schedules.filter((s) => s.id !== id);
    if (store.schedules.length > 0 && !store.schedules.some((s) => s.is_active)) {
      store.schedules[0].is_active = true;
    }
    writeLocalStore(store);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      awardTitle?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const awardTitle =
      typeof body.awardTitle === "string" && body.awardTitle.trim().length > 0
        ? body.awardTitle.trim()
        : `${name} Champion`;

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Subject name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { data: maxOrderRow } = await supabase
        .from("subjects")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderRow?.sort_order ?? 0) + 1;

      const { data, error } = await supabase
        .from("subjects")
        .insert({
          name,
          award_title: awardTitle,
          is_duty_category: false,
          is_hidden: false,
          sort_order: nextOrder,
        })
        .select("*")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to add subject." },
          { status: 500 }
        );
      }

      return NextResponse.json({ subject: data });
    }

    const store = readLocalStore();
    const nextOrder =
      Math.max(0, ...store.subjects.map((s) => s.sort_order)) + 1;
    const created = {
      id: generateId(),
      name,
      award_title: awardTitle,
      is_duty_category: false,
      is_hidden: false,
      sort_order: nextOrder,
      created_at: new Date().toISOString(),
    };
    store.subjects.push(created);
    writeLocalStore(store);

    return NextResponse.json({ subject: created });
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
      subjectId?: unknown;
      isHidden?: unknown;
      name?: unknown;
      awardTitle?: unknown;
    };

    const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : "";
    if (!subjectId) {
      return NextResponse.json({ error: "Missing subjectId." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.isHidden === "boolean") {
      updates.is_hidden = body.isHidden;
    }
    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      updates.name = body.name.trim();
    }
    if (typeof body.awardTitle === "string" && body.awardTitle.trim().length >= 2) {
      updates.award_title = body.awardTitle.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("subjects")
        .update(updates)
        .eq("id", subjectId)
        .select("*")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to update subject." },
          { status: 500 }
        );
      }

      return NextResponse.json({ subject: data });
    }

    const store = readLocalStore();
    const target = store.subjects.find((s) => s.id === subjectId);
    if (!target) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }
    if (typeof updates.is_hidden === "boolean") target.is_hidden = updates.is_hidden;
    if (typeof updates.name === "string") target.name = updates.name;
    if (typeof updates.award_title === "string") target.award_title = updates.award_title;
    writeLocalStore(store);

    return NextResponse.json({ subject: target });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

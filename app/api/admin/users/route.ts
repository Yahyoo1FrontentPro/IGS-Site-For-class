import { NextRequest, NextResponse } from "next/server";
import {
  BUILTIN_ADMIN_USERNAME,
  getSessionUser,
  isAdminAuthenticated,
} from "@/lib/auth";
import { isValidPhone, normalizePhone } from "@/lib/password";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { AppUserSummary, UserRole } from "@/types";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ users: [] });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, phone, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: (data ?? []) as AppUserSummary[] });
}

export async function PATCH(req: NextRequest) {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase database is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as {
      userId?: unknown;
      role?: unknown;
      phone?: unknown;
    };

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: targetUser } = await supabase
      .from("app_users")
      .select("id, username, role")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.role === "admin" || body.role === "student") {
      // Prevent demoting the primary owner account Yahyoo_Erikovich
      if (
        (targetUser.username as string).toLowerCase() ===
          BUILTIN_ADMIN_USERNAME.toLowerCase() &&
        body.role !== "admin"
      ) {
        return NextResponse.json(
          { error: "Primary owner account Yahyoo_Erikovich must remain Admin." },
          { status: 400 }
        );
      }
      updates.role = body.role as UserRole;
    }

    if (typeof body.phone === "string") {
      const trimmedPhone = body.phone.trim();
      if (trimmedPhone.length === 0) {
        updates.phone = null;
        updates.phone_normalized = null;
      } else {
        if (!isValidPhone(trimmedPhone)) {
          return NextResponse.json(
            { error: "Invalid phone number format." },
            { status: 400 }
          );
        }
        updates.phone = trimmedPhone;
        updates.phone_normalized = normalizePhone(trimmedPhone);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("app_users")
      .update(updates)
      .eq("id", userId)
      .select("id, username, phone, role, created_at")
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update account." },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updated as AppUserSummary });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

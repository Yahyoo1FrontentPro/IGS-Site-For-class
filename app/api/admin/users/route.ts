import { NextRequest, NextResponse } from "next/server";
import {
  BUILTIN_ADMIN_USERNAME,
  DEFAULT_STUDENT_PASSWORD_HASH,
  getSessionUser,
  isAdminAuthenticated,
} from "@/lib/auth";
import {
  readLocalStore,
  toUserSummary,
  writeLocalStore,
} from "@/lib/local-store";
import { isValidPhone, normalizePhone } from "@/lib/password";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { AppUserSummary, UserRole } from "@/types";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (isSupabaseAdminConfigured()) {
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

  const store = readLocalStore();
  return NextResponse.json({ users: store.appUsers.map(toUserSummary) });
}

export async function PATCH(req: NextRequest) {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      userId?: unknown;
      role?: unknown;
      phone?: unknown;
      resetPassword?: unknown;
    };

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
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

      if (body.resetPassword === true) {
        if (
          (targetUser.username as string).toLowerCase() ===
          BUILTIN_ADMIN_USERNAME.toLowerCase()
        ) {
          return NextResponse.json(
            { error: "Cannot reset primary owner password to default." },
            { status: 400 }
          );
        }
        updates.password_hash = DEFAULT_STUDENT_PASSWORD_HASH;
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
    }

    // Zero-Config Local Store Mode
    const store = readLocalStore();
    const target = store.appUsers.find((u) => u.id === userId);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (body.role === "admin" || body.role === "student") {
      if (
        target.username_lower === BUILTIN_ADMIN_USERNAME.toLowerCase() &&
        body.role !== "admin"
      ) {
        return NextResponse.json(
          { error: "Primary owner account Yahyoo_Erikovich must remain Admin." },
          { status: 400 }
        );
      }
      target.role = body.role;
    }

    if (typeof body.phone === "string") {
      const trimmedPhone = body.phone.trim();
      if (trimmedPhone.length === 0) {
        target.phone = null;
        target.phone_normalized = null;
      } else {
        if (!isValidPhone(trimmedPhone)) {
          return NextResponse.json(
            { error: "Invalid phone number format." },
            { status: 400 }
          );
        }
        target.phone = trimmedPhone;
        target.phone_normalized = normalizePhone(trimmedPhone);
      }
    }

    if (body.resetPassword === true) {
      if (target.username_lower === BUILTIN_ADMIN_USERNAME.toLowerCase()) {
        return NextResponse.json(
          { error: "Cannot reset primary owner password to default." },
          { status: 400 }
        );
      }
      target.password_hash = DEFAULT_STUDENT_PASSWORD_HASH;
    }

    writeLocalStore(store);
    return NextResponse.json({ user: toUserSummary(target) });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

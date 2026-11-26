import { NextRequest, NextResponse } from "next/server";
import {
  BUILTIN_ADMIN_USERNAME,
  DEFAULT_STUDENT_PASSWORD_HASH,
  getSessionUser,
  isAdminAuthenticated,
} from "@/lib/auth";
import {
  generateId,
  readLocalStore,
  toUserSummary,
  writeLocalStore,
} from "@/lib/local-store";
import {
  hashPassword,
  isValidPhone,
  isValidUsername,
  normalizePhone,
} from "@/lib/password";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase";
import { AppUserSummary, UserRole } from "@/types";

function mapUserSummary(row: Record<string, unknown>): AppUserSummary {
  return {
    id: String(row.id),
    username: String(row.username),
    phone: typeof row.phone === "string" ? row.phone : null,
    role: row.role === "admin" ? "admin" : "student",
    role_title: typeof row.role_title === "string" ? row.role_title : null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    const res = await supabase
      .from("app_users")
      .select("id, username, phone, role, role_title, created_at")
      .order("created_at", { ascending: true });

    if (!res.error && res.data) {
      return NextResponse.json({
        users: res.data.map((r) => mapUserSummary(r as Record<string, unknown>)),
      });
    }

    // Fallback if role_title column has not been added yet
    const fallback = await supabase
      .from("app_users")
      .select("id, username, phone, role, created_at")
      .order("created_at", { ascending: true });

    if (fallback.error) {
      return NextResponse.json(
        { error: fallback.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: (fallback.data ?? []).map((r) =>
        mapUserSummary(r as Record<string, unknown>)
      ),
    });
  }

  const store = readLocalStore();
  return NextResponse.json({ users: store.appUsers.map(toUserSummary) });
}

export async function POST(req: NextRequest) {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      username?: unknown;
      password?: unknown;
      phone?: unknown;
      role?: unknown;
      roleTitle?: unknown;
    };

    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password =
      typeof body.password === "string" && body.password.trim().length > 0
        ? body.password
        : "12345678";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role: UserRole = body.role === "admin" ? "admin" : "student";
    const roleTitle =
      typeof body.roleTitle === "string" && body.roleTitle.trim().length > 0
        ? body.roleTitle.trim().slice(0, 60)
        : null;

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–30 characters (letters, numbers, _, ., - only).",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    let phone: string | null = null;
    let phoneNormalized: string | null = null;
    if (rawPhone.length > 0) {
      if (!isValidPhone(rawPhone)) {
        return NextResponse.json(
          { error: "Invalid phone number format." },
          { status: 400 }
        );
      }
      phone = rawPhone;
      phoneNormalized = normalizePhone(rawPhone);
    }

    const passwordHash =
      password === "12345678"
        ? DEFAULT_STUDENT_PASSWORD_HASH
        : hashPassword(password);

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      const { data: existingUser } = await supabase
        .from("app_users")
        .select("id")
        .eq("username_lower", username.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { error: `Account @${username} already exists.` },
          { status: 409 }
        );
      }

      if (phoneNormalized) {
        const { data: existingPhone } = await supabase
          .from("app_users")
          .select("id")
          .eq("phone_normalized", phoneNormalized)
          .maybeSingle();
        if (existingPhone) {
          return NextResponse.json(
            { error: "That phone number is already linked to another account." },
            { status: 409 }
          );
        }
      }

      const insertPayload: Record<string, unknown> = {
        username,
        phone,
        phone_normalized: phoneNormalized,
        password_hash: passwordHash,
        role,
        role_title: roleTitle,
      };

      const res = await supabase
        .from("app_users")
        .insert(insertPayload)
        .select("id, username, phone, role, role_title, created_at")
        .single();

      if (!res.error && res.data) {
        return NextResponse.json(
          { user: mapUserSummary(res.data as Record<string, unknown>) },
          { status: 201 }
        );
      }

      // If role_title column doesn't exist yet, retry without role_title
      if (res.error?.message?.toLowerCase().includes("role_title")) {
        delete insertPayload.role_title;
        const retry = await supabase
          .from("app_users")
          .insert(insertPayload)
          .select("id, username, phone, role, created_at")
          .single();

        if (retry.error || !retry.data) {
          return NextResponse.json(
            { error: retry.error?.message ?? "Failed to create account." },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            user: mapUserSummary(retry.data as Record<string, unknown>),
            warning:
              "Account created. Run supabase_migration_v2.sql in Supabase to save custom role titles permanently.",
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        { error: res.error?.message ?? "Failed to create account." },
        { status: 500 }
      );
    }

    // Local store fallback
    const store = readLocalStore();
    if (
      store.appUsers.some(
        (u) => u.username_lower === username.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: `Account @${username} already exists.` },
        { status: 409 }
      );
    }

    const created = {
      id: generateId(),
      username,
      username_lower: username.toLowerCase(),
      phone,
      phone_normalized: phoneNormalized,
      password_hash: passwordHash,
      role,
      role_title: roleTitle,
      created_at: new Date().toISOString(),
    };
    store.appUsers.push(created);
    writeLocalStore(store);

    return NextResponse.json(
      { user: toUserSummary(created) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
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
      roleTitle?: unknown;
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
            {
              error:
                "Primary owner account Yahyoo_Erikovich must remain Admin.",
            },
            { status: 400 }
          );
        }
        updates.role = body.role as UserRole;
      }

      if (body.roleTitle !== undefined) {
        if (typeof body.roleTitle === "string") {
          const trimmed = body.roleTitle.trim().slice(0, 60);
          updates.role_title = trimmed.length > 0 ? trimmed : null;
        } else if (body.roleTitle === null) {
          updates.role_title = null;
        }
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
        return NextResponse.json(
          { error: "Nothing to update." },
          { status: 400 }
        );
      }

      const res = await supabase
        .from("app_users")
        .update(updates)
        .eq("id", userId)
        .select("id, username, phone, role, role_title, created_at")
        .single();

      if (!res.error && res.data) {
        return NextResponse.json({
          user: mapUserSummary(res.data as Record<string, unknown>),
        });
      }

      // If role_title column hasn't been added yet, retry without role_title if other updates exist
      if (res.error?.message?.toLowerCase().includes("role_title")) {
        delete updates.role_title;
        if (Object.keys(updates).length === 0) {
          return NextResponse.json(
            {
              error:
                "Please run supabase_migration_v2.sql in Supabase SQL Editor to enable custom role titles.",
            },
            { status: 500 }
          );
        }
        const retry = await supabase
          .from("app_users")
          .update(updates)
          .eq("id", userId)
          .select("id, username, phone, role, created_at")
          .single();

        if (retry.error || !retry.data) {
          return NextResponse.json(
            { error: retry.error?.message ?? "Failed to update account." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          user: mapUserSummary(retry.data as Record<string, unknown>),
          warning:
            "Role updated. Run supabase_migration_v2.sql in Supabase to save custom titles.",
        });
      }

      return NextResponse.json(
        { error: res.error?.message ?? "Failed to update account." },
        { status: 500 }
      );
    }

    // Local Store Mode
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
          {
            error: "Primary owner account Yahyoo_Erikovich must remain Admin.",
          },
          { status: 400 }
        );
      }
      target.role = body.role;
    }

    if (body.roleTitle !== undefined) {
      if (typeof body.roleTitle === "string") {
        const trimmed = body.roleTitle.trim().slice(0, 60);
        target.role_title = trimmed.length > 0 ? trimmed : null;
      } else if (body.roleTitle === null) {
        target.role_title = null;
      }
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

export async function DELETE(req: NextRequest) {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim() ?? "";
    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active account." },
        { status: 400 }
      );
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { data: targetUser } = await supabase
        .from("app_users")
        .select("id, username")
        .eq("id", userId)
        .single();

      if (!targetUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      if (
        (targetUser.username as string).toLowerCase() ===
        BUILTIN_ADMIN_USERNAME.toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Primary owner account cannot be deleted." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("app_users")
        .delete()
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ deleted: true });
    }

    const store = readLocalStore();
    const target = store.appUsers.find((u) => u.id === userId);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (target.username_lower === BUILTIN_ADMIN_USERNAME.toLowerCase()) {
      return NextResponse.json(
        { error: "Primary owner account cannot be deleted." },
        { status: 400 }
      );
    }
    store.appUsers = store.appUsers.filter((u) => u.id !== userId);
    writeLocalStore(store);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

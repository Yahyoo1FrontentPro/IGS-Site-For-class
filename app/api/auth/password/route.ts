import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookieValue,
  getSessionUser,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { readLocalStore, writeLocalStore } from "@/lib/local-store";
import {
  hashPassword,
  isValidPhone,
  normalizePhone,
  verifyPassword,
} from "@/lib/password";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { SessionUser } from "@/types";

export async function PATCH(req: NextRequest) {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Please log in to update your account." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      currentPassword?: unknown;
      newPassword?: unknown;
      phone?: unknown;
    };

    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const hasPhoneUpdate = typeof body.phone === "string";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";

    const wantsPasswordChange = newPassword.length > 0;

    if (!wantsPasswordChange && !hasPhoneUpdate) {
      return NextResponse.json(
        { error: "Nothing to update." },
        { status: 400 }
      );
    }

    if (wantsPasswordChange) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Please enter your current password." },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
    }

    if (hasPhoneUpdate && rawPhone.length > 0 && !isValidPhone(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (7 to 15 digits)." },
        { status: 400 }
      );
    }

    // 1. Supabase Mode
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { data: userRow, error: fetchErr } = await supabase
        .from("app_users")
        .select("id, username, phone, password_hash, role")
        .eq("username_lower", sessionUser.username.toLowerCase())
        .maybeSingle();

      if (fetchErr || !userRow) {
        return NextResponse.json(
          { error: "Account record not found." },
          { status: 404 }
        );
      }

      if (wantsPasswordChange) {
        const validCurrent = verifyPassword(
          currentPassword,
          userRow.password_hash as string
        );
        if (!validCurrent) {
          return NextResponse.json(
            { error: "Your current password is incorrect." },
            { status: 401 }
          );
        }
      }

      const updates: Record<string, unknown> = {};
      if (wantsPasswordChange) {
        updates.password_hash = hashPassword(newPassword);
      }

      if (hasPhoneUpdate) {
        if (rawPhone.length === 0) {
          updates.phone = null;
          updates.phone_normalized = null;
        } else {
          const norm = normalizePhone(rawPhone);
          const { data: conflict } = await supabase
            .from("app_users")
            .select("id")
            .eq("phone_normalized", norm)
            .neq("id", userRow.id)
            .maybeSingle();

          if (conflict) {
            return NextResponse.json(
              { error: "That phone number is already linked to another account." },
              { status: 409 }
            );
          }

          updates.phone = rawPhone;
          updates.phone_normalized = norm;
        }
      }

      const { data: updated, error: updateErr } = await supabase
        .from("app_users")
        .update(updates)
        .eq("id", userRow.id)
        .select("id, username, phone, role")
        .single();

      if (updateErr || !updated) {
        return NextResponse.json(
          { error: updateErr?.message ?? "Failed to update account." },
          { status: 500 }
        );
      }

      const updatedSession: SessionUser = {
        id: updated.id as string,
        username: updated.username as string,
        phone: (updated.phone as string | null) ?? null,
        role: (updated.role as "admin" | "student") ?? sessionUser.role,
      };

      const response = NextResponse.json({ user: updatedSession, updated: true });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: createSessionCookieValue(updatedSession),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
      return response;
    }

    // 2. Local Store Fallback
    const store = readLocalStore();
    const target = store.appUsers.find(
      (u) => u.username_lower === sessionUser.username.toLowerCase()
    );
    if (!target) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (wantsPasswordChange) {
      if (!verifyPassword(currentPassword, target.password_hash)) {
        return NextResponse.json(
          { error: "Your current password is incorrect." },
          { status: 401 }
        );
      }
      target.password_hash = hashPassword(newPassword);
    }

    if (hasPhoneUpdate) {
      if (rawPhone.length === 0) {
        target.phone = null;
        target.phone_normalized = null;
      } else {
        const norm = normalizePhone(rawPhone);
        const conflict = store.appUsers.some(
          (u) => u.id !== target.id && u.phone_normalized === norm
        );
        if (conflict) {
          return NextResponse.json(
            { error: "That phone number is already linked to another account." },
            { status: 409 }
          );
        }
        target.phone = rawPhone;
        target.phone_normalized = norm;
      }
    }

    writeLocalStore(store);

    const updatedSession: SessionUser = {
      id: target.id,
      username: target.username,
      phone: target.phone,
      role: target.role,
    };

    const response = NextResponse.json({ user: updatedSession, updated: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionCookieValue(updatedSession),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

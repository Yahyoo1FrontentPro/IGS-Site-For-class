import { NextRequest, NextResponse } from "next/server";
import {
  BUILTIN_ADMIN_PASSWORD_HASH,
  BUILTIN_ADMIN_USERNAME,
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { normalizePhone, verifyPassword } from "@/lib/password";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      identifier?: unknown;
      password?: unknown;
    };

    const identifier =
      typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please enter your phone number or username and password." },
        { status: 400 }
      );
    }

    // 1. If Supabase is configured, authenticate against app_users table
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const lowerId = identifier.toLowerCase();
      const digitsOnly = normalizePhone(identifier);

      const { data: byUsername } = await supabase
        .from("app_users")
        .select("id, username, phone, password_hash, role")
        .eq("username_lower", lowerId)
        .maybeSingle();

      let matchedUser = byUsername;

      if (!matchedUser && digitsOnly.length >= 7) {
        const { data: byPhone } = await supabase
          .from("app_users")
          .select("id, username, phone, password_hash, role")
          .eq("phone_normalized", digitsOnly)
          .maybeSingle();
        matchedUser = byPhone;
      }

      if (matchedUser) {
        const ok = verifyPassword(password, matchedUser.password_hash as string);
        if (!ok) {
          return NextResponse.json(
            { error: "Incorrect phone/username or password." },
            { status: 401 }
          );
        }

        const sessionUser: SessionUser = {
          id: matchedUser.id as string,
          username: matchedUser.username as string,
          phone: (matchedUser.phone as string | null) ?? null,
          role: (matchedUser.role as "admin" | "student") ?? "student",
        };

        const response = NextResponse.json({ user: sessionUser });
        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: createSessionCookieValue(sessionUser),
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 14,
        });
        return response;
      }

      // Auto-provision primary admin if app_users exists or if signing in as Yahyoo_Erikovich before seeding
      if (
        lowerId === BUILTIN_ADMIN_USERNAME.toLowerCase() &&
        verifyPassword(password, BUILTIN_ADMIN_PASSWORD_HASH)
      ) {
        const { data: seededAdmin } = await supabase
          .from("app_users")
          .insert({
            username: BUILTIN_ADMIN_USERNAME,
            password_hash: BUILTIN_ADMIN_PASSWORD_HASH,
            role: "admin",
          })
          .select("id, username, phone, role")
          .maybeSingle();

        const sessionUser: SessionUser = {
          id: (seededAdmin?.id as string | undefined) ?? "builtin-admin-yahyo",
          username: BUILTIN_ADMIN_USERNAME,
          phone: (seededAdmin?.phone as string | null) ?? null,
          role: "admin",
        };

        const response = NextResponse.json({ user: sessionUser });
        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: createSessionCookieValue(sessionUser),
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 14,
        });
        return response;
      }

      return NextResponse.json(
        { error: "Incorrect phone/username or password." },
        { status: 401 }
      );
    }

    // 2. Preview Mode fallback (before Supabase is connected): allow Yahyoo_Erikovich login
    if (
      identifier.toLowerCase() === BUILTIN_ADMIN_USERNAME.toLowerCase() &&
      verifyPassword(password, BUILTIN_ADMIN_PASSWORD_HASH)
    ) {
      const sessionUser: SessionUser = {
        id: "builtin-admin-yahyo",
        username: BUILTIN_ADMIN_USERNAME,
        phone: null,
        role: "admin",
      };

      const response = NextResponse.json({ user: sessionUser });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: createSessionCookieValue(sessionUser),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
      return response;
    }

    return NextResponse.json(
      { error: "Incorrect phone/username or password." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid login payload." },
      { status: 400 }
    );
  }
}

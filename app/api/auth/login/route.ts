import { NextRequest, NextResponse } from "next/server";
import {
  BUILTIN_ADMIN_PASSWORD_HASH,
  BUILTIN_ADMIN_USERNAME,
  createSessionCookieValue,
  DEFAULT_STUDENT_PASSWORD_HASH,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { readLocalStore } from "@/lib/local-store";
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

    const lowerId = identifier.toLowerCase();
    const digitsOnly = normalizePhone(identifier);

    // 1. If Supabase is configured, authenticate against app_users table
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      const fetchUserBy = async (column: "username_lower" | "phone_normalized", value: string) => {
        const res = await supabase
          .from("app_users")
          .select("id, username, phone, password_hash, role, role_title")
          .eq(column, value)
          .maybeSingle();
        if (!res.error) return res.data as Record<string, unknown> | null;
        // Fallback if role_title column has not been migrated yet
        const fallback = await supabase
          .from("app_users")
          .select("id, username, phone, password_hash, role")
          .eq(column, value)
          .maybeSingle();
        return fallback.data as Record<string, unknown> | null;
      };

      let matchedUser = await fetchUserBy("username_lower", lowerId);

      if (!matchedUser && digitsOnly.length >= 7) {
        matchedUser = await fetchUserBy("phone_normalized", digitsOnly);
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
          role_title:
            typeof matchedUser.role_title === "string"
              ? matchedUser.role_title
              : null,
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
          id: (seededAdmin?.id as string | undefined) ?? "admin-yahyo-primary",
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

      // Auto-provision student account if student exists in roster and logs in with initial password (12345678)
      if (verifyPassword(password, DEFAULT_STUDENT_PASSWORD_HASH)) {
        const { data: rosterStudent } = await supabase
          .from("students")
          .select("id, name")
          .ilike("name", identifier)
          .limit(1)
          .maybeSingle();

        if (rosterStudent) {
          const safeUsername = (rosterStudent.name as string).replace(/\s+/g, "_");
          const { data: createdStudentAcc } = await supabase
            .from("app_users")
            .insert({
              username: safeUsername,
              password_hash: DEFAULT_STUDENT_PASSWORD_HASH,
              role: "student",
            })
            .select("id, username, phone, role")
            .maybeSingle();

          const sessionUser: SessionUser = {
            id: (createdStudentAcc?.id as string | undefined) ?? (rosterStudent.id as string),
            username: (createdStudentAcc?.username as string | undefined) ?? safeUsername,
            phone: null,
            role: "student",
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
      }

      return NextResponse.json(
        { error: "Incorrect phone/username or password." },
        { status: 401 }
      );
    }

    // 2. Zero-config built-in store authentication (supports all registered users + Yahyoo_Erikovich)
    const store = readLocalStore();
    const localMatch = store.appUsers.find(
      (u) =>
        u.username_lower === lowerId ||
        (digitsOnly.length >= 7 && u.phone_normalized === digitsOnly)
    );

    if (!localMatch || !verifyPassword(password, localMatch.password_hash)) {
      return NextResponse.json(
        { error: "Incorrect phone/username or password." },
        { status: 401 }
      );
    }

    const sessionUser: SessionUser = {
      id: localMatch.id,
      username: localMatch.username,
      phone: localMatch.phone,
      role: localMatch.role,
      role_title: localMatch.role_title ?? null,
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
  } catch {
    return NextResponse.json(
      { error: "Invalid login payload." },
      { status: 400 }
    );
  }
}

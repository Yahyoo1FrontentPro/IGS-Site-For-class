import { NextRequest, NextResponse } from "next/server";
import {
  BUILTIN_ADMIN_USERNAME,
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import {
  hashPassword,
  isValidPhone,
  isValidUsername,
  normalizePhone,
} from "@/lib/password";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase database credentials are not configured yet. Connect NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Render / .env.local and run schema.sql.",
      },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as {
      phone?: unknown;
      username?: unknown;
      password?: unknown;
    };

    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidPhone(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (7 to 15 digits)." },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–30 characters using letters, numbers, underscores (_), dots (.), or hyphens (-).",
        },
        { status: 400 }
      );
    }

    if (username.toLowerCase() === BUILTIN_ADMIN_USERNAME.toLowerCase()) {
      return NextResponse.json(
        { error: "This username is reserved for the Class Leader Admin." },
        { status: 409 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const phoneNormalized = normalizePhone(rawPhone);
    const supabase = getSupabaseAdminClient();

    // Check if username or phone already exists
    const [{ data: existingUser }, { data: existingPhone }] = await Promise.all([
      supabase
        .from("app_users")
        .select("id")
        .eq("username_lower", username.toLowerCase())
        .maybeSingle(),
      supabase
        .from("app_users")
        .select("id")
        .eq("phone_normalized", phoneNormalized)
        .maybeSingle(),
    ]);

    if (existingUser) {
      return NextResponse.json(
        { error: "That username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const { data: created, error } = await supabase
      .from("app_users")
      .insert({
        username,
        phone: rawPhone,
        phone_normalized: phoneNormalized,
        password_hash: passwordHash,
        role: "student",
      })
      .select("id, username, phone, role")
      .single();

    if (error || !created) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Could not create account. Ensure you ran the updated schema.sql in Supabase.",
        },
        { status: 500 }
      );
    }

    const sessionUser: SessionUser = {
      id: created.id as string,
      username: created.username as string,
      phone: (created.phone as string | null) ?? rawPhone,
      role: (created.role as "admin" | "student") ?? "student",
    };

    const cookieVal = createSessionCookieValue(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: cookieVal,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid registration payload." },
      { status: 400 }
    );
  }
}

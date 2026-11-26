import crypto from "crypto";
import { cookies } from "next/headers";
import { SessionUser } from "@/types";

export const SESSION_COOKIE_NAME = "igs_myp3_user_session";

// Pre-hashed fallback record for primary admin when previewing before Supabase is connected
export const BUILTIN_ADMIN_USERNAME = "Yahyoo_Erikovich";
export const BUILTIN_ADMIN_PASSWORD_HASH =
  "scrypt$90d198582807636394c51b005d8d2cec$29daa76500aac959de23d6b12f719a2d8d8302f0cafd0fe647e220d1ed4e27ba0c4f4cbde1c6491cafc619245f5b9a9b74bb4f6b149cb1b14e5911986455a02b";

// Default initial password hash (12345678) for all class students (changeable anytime at /account)
export const DEFAULT_STUDENT_PASSWORD_HASH =
  "scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0";

function getSigningSecret(): string {
  const candidates = [
    process.env.SESSION_SECRET,
    process.env.ADMIN_PASSWORD,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];
  for (const val of candidates) {
    if (val && val.trim().length > 0 && !val.includes("your-supabase-")) {
      return val.trim();
    }
  }
  return "igs-myp3-local-dev-signing-secret-v1";
}

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function createSessionCookieValue(user: SessionUser): string {
  const payload = JSON.stringify({
    id: user.id,
    username: user.username,
    phone: user.phone,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function getSessionUser(): SessionUser | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!raw) return null;

    const dotIdx = raw.indexOf(".");
    if (dotIdx <= 0) return null;

    const payloadB64 = raw.slice(0, dotIdx);
    const providedSig = raw.slice(dotIdx + 1);
    const expectedSig = signPayload(payloadB64);

    const aBuf = Buffer.from(providedSig, "utf8");
    const bBuf = Buffer.from(expectedSig, "utf8");
    if (aBuf.length !== bBuf.length || !crypto.timingSafeEqual(aBuf, bBuf)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as SessionUser & { exp?: number };

    if (!parsed.exp || Date.now() > parsed.exp) {
      return null;
    }

    if (!parsed.id || !parsed.username || (parsed.role !== "admin" && parsed.role !== "student")) {
      return null;
    }

    return {
      id: parsed.id,
      username: parsed.username,
      phone: parsed.phone ?? null,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  const user = getSessionUser();
  return user?.role === "admin";
}

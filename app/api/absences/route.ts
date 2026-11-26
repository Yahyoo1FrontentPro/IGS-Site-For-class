import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createAbsenceReport,
  fetchAllAbsences,
  fetchUserAbsences,
} from "@/lib/absences";

export async function GET() {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const absences =
    user.role === "admin"
      ? await fetchAllAbsences()
      : await fetchUserAbsences(user.id, user.username);

  return NextResponse.json({ absences });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to report an absence." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      absenceDate?: unknown;
      reason?: unknown;
    };

    const absenceDate =
      typeof body.absenceDate === "string" ? body.absenceDate.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(absenceDate)) {
      return NextResponse.json(
        { error: "Please select a valid date." },
        { status: 400 }
      );
    }

    if (reason.length < 3) {
      return NextResponse.json(
        { error: "Please provide a clear reason (at least 3 characters)." },
        { status: 400 }
      );
    }

    const report = await createAbsenceReport({
      userId: user.id,
      username: user.username,
      absenceDate,
      reason: reason.slice(0, 500),
    });

    return NextResponse.json({ absence: report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

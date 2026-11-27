import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdminAuthenticated } from "@/lib/auth";
import { fetchAllRollCalls, saveRollCallForDate } from "@/lib/roll-call";
import { RollCallStatus } from "@/types";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rollCalls = await fetchAllRollCalls();
  return NextResponse.json({ rollCalls });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      rollDate?: unknown;
      entries?: unknown;
    };

    const rollDate = typeof body.rollDate === "string" ? body.rollDate.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rollDate)) {
      return NextResponse.json(
        { error: "Please select a valid roll-call date." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.entries) || body.entries.length === 0) {
      return NextResponse.json(
        { error: "No student attendance entries provided." },
        { status: 400 }
      );
    }

    const sanitized = body.entries
      .map((raw) => {
        const item = raw as Record<string, unknown>;
        const studentId =
          typeof item.studentId === "string" ? item.studentId.trim() : "";
        const studentName =
          typeof item.studentName === "string" ? item.studentName.trim() : "";
        const rawStatus =
          typeof item.status === "string" ? item.status.trim() : "present";
        const status: RollCallStatus =
          rawStatus === "absent" ||
          rawStatus === "late" ||
          rawStatus === "excused"
            ? rawStatus
            : "present";
        const note =
          typeof item.note === "string" ? item.note.trim().slice(0, 200) : null;

        return { studentId, studentName, status, note };
      })
      .filter((e) => e.studentId && e.studentName);

    const saved = await saveRollCallForDate({
      rollDate,
      recordedBy: user.username,
      entries: sanitized,
    });

    return NextResponse.json({ entries: saved }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

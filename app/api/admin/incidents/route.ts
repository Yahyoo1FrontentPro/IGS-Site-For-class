import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdminAuthenticated } from "@/lib/auth";
import {
  createLessonIncident,
  deleteLessonIncident,
  fetchAllLessonIncidents,
} from "@/lib/roll-call";
import { LessonIncidentType } from "@/types";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const incidents = await fetchAllLessonIncidents();
  return NextResponse.json({ incidents });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      incidentDate?: unknown;
      incidentType?: unknown;
      subjectName?: unknown;
      teacherName?: unknown;
      periodLabel?: unknown;
      notes?: unknown;
    };

    const incidentDate =
      typeof body.incidentDate === "string" ? body.incidentDate.trim() : "";
    const incidentType: LessonIncidentType =
      body.incidentType === "class_cancelled"
        ? "class_cancelled"
        : "teacher_noshow";
    const subjectName =
      typeof body.subjectName === "string" ? body.subjectName.trim() : "";
    const teacherName =
      typeof body.teacherName === "string" && body.teacherName.trim().length > 0
        ? body.teacherName.trim().slice(0, 100)
        : null;
    const periodLabel =
      typeof body.periodLabel === "string" && body.periodLabel.trim().length > 0
        ? body.periodLabel.trim().slice(0, 60)
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim().length > 0
        ? body.notes.trim().slice(0, 500)
        : null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) {
      return NextResponse.json(
        { error: "Please select a valid date." },
        { status: 400 }
      );
    }

    if (!subjectName) {
      return NextResponse.json(
        { error: "Please select or enter a subject." },
        { status: 400 }
      );
    }

    const incident = await createLessonIncident({
      incidentDate,
      incidentType,
      subjectName: subjectName.slice(0, 80),
      teacherName,
      periodLabel,
      notes,
      recordedBy: user.username,
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing incident id." }, { status: 400 });
  }

  const ok = await deleteLessonIncident(id);
  if (!ok) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}

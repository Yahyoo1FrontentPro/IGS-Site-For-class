import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deleteAbsenceReport,
  fetchAllAbsences,
  updateAbsenceStatus,
} from "@/lib/absences";
import { AbsenceStatus } from "@/types";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const absences = await fetchAllAbsences();
  return NextResponse.json({ absences });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      id?: unknown;
      status?: unknown;
      adminNote?: unknown;
    };

    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status: AbsenceStatus =
      body.status === "acknowledged" ? "acknowledged" : "pending";
    const adminNote =
      typeof body.adminNote === "string"
        ? body.adminNote.trim().slice(0, 300) || null
        : undefined;

    if (!id) {
      return NextResponse.json({ error: "Missing report id." }, { status: 400 });
    }

    const updated = await updateAbsenceStatus({ id, status, adminNote });
    if (!updated) {
      return NextResponse.json(
        { error: "Absence report not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ absence: updated });
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
    return NextResponse.json({ error: "Missing report id." }, { status: 400 });
  }

  const ok = await deleteAbsenceReport(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Absence report not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}

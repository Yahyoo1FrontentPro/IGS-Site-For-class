import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  generateId,
  readLocalStore,
  writeLocalStore,
} from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { PointCategory, PointLog } from "@/types";

const VALID_CATEGORIES: PointCategory[] = [
  "Active",
  "Star",
  "Ace",
  "Duty",
  "Fair-Play",
];

const EXPECTED_POINTS: Record<PointCategory, number> = {
  Active: 1,
  Star: 2,
  Ace: 3,
  Duty: 1,
  "Fair-Play": -1,
};

function isValidISODate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in as Admin." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      studentId?: unknown;
      subjectId?: unknown;
      weekId?: unknown;
      date?: unknown;
      category?: unknown;
      reason?: unknown;
    };

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : "";
    const weekId = typeof body.weekId === "string" ? body.weekId.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const category = body.category as PointCategory;
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : null;

    if (!studentId || !subjectId || !weekId || !isValidISODate(date)) {
      return NextResponse.json(
        { error: "Missing or invalid student, subject, week, or date." },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid point category." }, { status: 400 });
    }

    if (category === "Fair-Play" && (!reason || reason.length < 3)) {
      return NextResponse.json(
        { error: "A clear Fair-Play reason (at least 3 characters) is mandatory." },
        { status: 400 }
      );
    }

    const points = EXPECTED_POINTS[category];

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      const { data: student, error: studentErr } = await supabase
        .from("students")
        .select("id, name, is_active")
        .eq("id", studentId)
        .single();

      if (studentErr || !student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }

      let effectiveSubjectId = subjectId;
      if (category === "Duty") {
        const { data: dutySubject } = await supabase
          .from("subjects")
          .select("id")
          .eq("is_duty_category", true)
          .limit(1)
          .maybeSingle();

        if (dutySubject?.id) {
          effectiveSubjectId = dutySubject.id;
        }
      }

      const { data: insertedLog, error: insertErr } = await supabase
        .from("point_logs")
        .insert({
          student_id: student.id,
          subject_id: effectiveSubjectId,
          week_id: weekId,
          points,
          category,
          reason,
          date,
        })
        .select("id, student_id, subject_id, week_id, points, category, reason, date, created_at")
        .single();

      if (insertErr || !insertedLog) {
        return NextResponse.json(
          { error: insertErr?.message ?? "Failed to insert point log." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        pointLog: insertedLog as PointLog,
      });
    }

    // Local Store Fallback
    const store = readLocalStore();
    const student = store.students.find((s) => s.id === studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    let effectiveSubjectId = subjectId;
    if (category === "Duty") {
      const dutySub = store.subjects.find((s) => s.is_duty_category);
      if (dutySub) effectiveSubjectId = dutySub.id;
    }

    const createdLog: PointLog = {
      id: generateId(),
      student_id: student.id,
      subject_id: effectiveSubjectId,
      week_id: weekId,
      points,
      category,
      reason,
      date,
      created_at: new Date().toISOString(),
    };
    store.pointLogs.unshift(createdLog);
    writeLocalStore(store);

    return NextResponse.json({
      pointLog: createdLog,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing point log id." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();
      const { error: delErr } = await supabase.from("point_logs").delete().eq("id", id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      return NextResponse.json({ undone: true });
    }

    const store = readLocalStore();
    const logIdx = store.pointLogs.findIndex((l) => l.id === id);
    if (logIdx === -1) {
      return NextResponse.json({ error: "Point log not found." }, { status: 404 });
    }
    store.pointLogs.splice(logIdx, 1);
    writeLocalStore(store);

    return NextResponse.json({ undone: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

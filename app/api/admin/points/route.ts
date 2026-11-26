import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { PointCategory, PointLog, TeamBonus } from "@/types";

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
    return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase Service Role Key is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
      },
      { status: 500 }
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
    const supabase = getSupabaseAdminClient();

    // 1. Fetch student & team info
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id, name, team_id, is_active")
      .eq("id", studentId)
      .single();

    if (studentErr || !student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // 2. If category === 'Duty', route to Class Duty & Teamwork subject if available
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

    // 3. Insert point log
    const { data: insertedLog, error: insertErr } = await supabase
      .from("point_logs")
      .insert({
        student_id: student.id,
        team_id: student.team_id,
        subject_id: effectiveSubjectId,
        week_id: weekId,
        points,
        category,
        reason,
        date,
      })
      .select("*")
      .single();

    if (insertErr || !insertedLog) {
      return NextResponse.json(
        { error: insertErr?.message ?? "Failed to insert point log." },
        { status: 500 }
      );
    }

    // 4. Dynamic Team Combo Streak Check (only when positive points are earned)
    let comboAwarded = false;
    let teamBonus: TeamBonus | null = null;
    let teamName = "";

    if (points > 0) {
      const [teamRes, teamMembersRes] = await Promise.all([
        supabase.from("teams").select("id, name").eq("id", student.team_id).single(),
        supabase
          .from("students")
          .select("id")
          .eq("team_id", student.team_id)
          .eq("is_active", true),
      ]);

      teamName = teamRes.data?.name ?? "Team";
      const activeMembers = teamMembersRes.data ?? [];

      if (activeMembers.length > 0) {
        const memberIds = activeMembers.map((m) => m.id);

        const { data: positiveLogsToday } = await supabase
          .from("point_logs")
          .select("student_id")
          .eq("date", date)
          .gt("points", 0)
          .in("student_id", memberIds);

        const distinctActiveScorers = new Set(
          (positiveLogsToday ?? []).map((row) => row.student_id)
        );

        const allMembersScored = memberIds.every((id) =>
          distinctActiveScorers.has(id)
        );

        if (allMembersScored) {
          // Check if already awarded for (team_id, date)
          const { data: existingBonus } = await supabase
            .from("team_bonuses")
            .select("id")
            .eq("team_id", student.team_id)
            .eq("date", date)
            .maybeSingle();

          if (!existingBonus) {
            const { data: createdBonus, error: bonusErr } = await supabase
              .from("team_bonuses")
              .insert({
                team_id: student.team_id,
                week_id: weekId,
                date,
                points: 5,
                reason: `Team Combo Streak: All ${activeMembers.length} members of ${teamName} earned points on ${date}!`,
              })
              .select("*")
              .maybeSingle();

            // Ignore unique constraint race condition (code 23505) gracefully
            if (!bonusErr && createdBonus) {
              comboAwarded = true;
              teamBonus = createdBonus as TeamBonus;
            }
          }
        }
      }
    }

    return NextResponse.json({
      pointLog: insertedLog as PointLog,
      comboAwarded,
      teamBonus,
      teamName,
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

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase Service Role Key is not configured." },
      { status: 500 }
    );
  }

  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing point log id." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch log details prior to deletion so we can re-validate Team Combo Streak if needed
    const { data: existingLog, error: fetchErr } = await supabase
      .from("point_logs")
      .select("id, team_id, date, points")
      .eq("id", id)
      .single();

    if (fetchErr || !existingLog) {
      return NextResponse.json({ error: "Point log not found." }, { status: 404 });
    }

    const { error: delErr } = await supabase.from("point_logs").delete().eq("id", id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    let comboRevoked = false;

    if (existingLog.points > 0) {
      const { data: bonusOnDate } = await supabase
        .from("team_bonuses")
        .select("id")
        .eq("team_id", existingLog.team_id)
        .eq("date", existingLog.date)
        .maybeSingle();

      if (bonusOnDate) {
        const { data: activeMembers } = await supabase
          .from("students")
          .select("id")
          .eq("team_id", existingLog.team_id)
          .eq("is_active", true);

        const memberIds = (activeMembers ?? []).map((m) => m.id);

        if (memberIds.length > 0) {
          const { data: remainingLogs } = await supabase
            .from("point_logs")
            .select("student_id")
            .eq("date", existingLog.date)
            .gt("points", 0)
            .in("student_id", memberIds);

          const remainingSet = new Set((remainingLogs ?? []).map((r) => r.student_id));
          const stillComplete = memberIds.every((mId) => remainingSet.has(mId));

          if (!stillComplete) {
            await supabase.from("team_bonuses").delete().eq("id", bonusOnDate.id);
            comboRevoked = true;
          }
        }
      }
    }

    return NextResponse.json({ undone: true, comboRevoked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

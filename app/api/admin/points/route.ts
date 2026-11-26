import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  generateId,
  readLocalStore,
  writeLocalStore,
} from "@/lib/local-store";
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

    // 1. Supabase PostgreSQL Mode
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

      const { data: student, error: studentErr } = await supabase
        .from("students")
        .select("id, name, team_id, is_active")
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

          if (memberIds.every((id) => distinctActiveScorers.has(id))) {
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
    }

    // 2. Zero-Config Local Store Mode
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
      team_id: student.team_id,
      subject_id: effectiveSubjectId,
      week_id: weekId,
      points,
      category,
      reason,
      date,
      created_at: new Date().toISOString(),
    };
    store.pointLogs.unshift(createdLog);

    let comboAwarded = false;
    let teamBonus: TeamBonus | null = null;
    const teamObj = store.teams.find((t) => t.id === student.team_id);
    const teamName = teamObj?.name ?? "Team";

    if (points > 0) {
      const activeMembers = store.students.filter(
        (s) => s.team_id === student.team_id && s.is_active
      );

      if (activeMembers.length > 0) {
        const scorersToday = new Set(
          store.pointLogs
            .filter((l) => l.date === date && l.points > 0)
            .map((l) => l.student_id)
        );

        const allScored = activeMembers.every((m) => scorersToday.has(m.id));
        const alreadyAwarded = store.teamBonuses.some(
          (b) => b.team_id === student.team_id && b.date === date
        );

        if (allScored && !alreadyAwarded) {
          teamBonus = {
            id: generateId(),
            team_id: student.team_id,
            week_id: weekId,
            date,
            points: 5,
            reason: `Team Combo Streak: All ${activeMembers.length} members of ${teamName} earned points on ${date}!`,
            created_at: new Date().toISOString(),
          };
          store.teamBonuses.unshift(teamBonus);
          comboAwarded = true;
        }
      }
    }

    writeLocalStore(store);

    return NextResponse.json({
      pointLog: createdLog,
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

  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing point log id." }, { status: 400 });
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdminClient();

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
            if (!memberIds.every((mId) => remainingSet.has(mId))) {
              await supabase.from("team_bonuses").delete().eq("id", bonusOnDate.id);
              comboRevoked = true;
            }
          }
        }
      }

      return NextResponse.json({ undone: true, comboRevoked });
    }

    // Zero-Config Local Store Undo
    const store = readLocalStore();
    const logIdx = store.pointLogs.findIndex((l) => l.id === id);
    if (logIdx === -1) {
      return NextResponse.json({ error: "Point log not found." }, { status: 404 });
    }

    const removed = store.pointLogs[logIdx];
    store.pointLogs.splice(logIdx, 1);

    let comboRevoked = false;
    if (removed.points > 0) {
      const bonusIdx = store.teamBonuses.findIndex(
        (b) => b.team_id === removed.team_id && b.date === removed.date
      );
      if (bonusIdx !== -1) {
        const activeMembers = store.students.filter(
          (s) => s.team_id === removed.team_id && s.is_active
        );
        const remainingSet = new Set(
          store.pointLogs
            .filter((l) => l.date === removed.date && l.points > 0)
            .map((l) => l.student_id)
        );
        if (!activeMembers.every((m) => remainingSet.has(m.id))) {
          store.teamBonuses.splice(bonusIdx, 1);
          comboRevoked = true;
        }
      }
    }

    writeLocalStore(store);
    return NextResponse.json({ undone: true, comboRevoked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

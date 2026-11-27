import {
  LessonIncident,
  LessonIncidentType,
  RollCallEntry,
  RollCallStatus,
} from "@/types";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function mapRollCallRow(row: Record<string, unknown>): RollCallEntry {
  const rawStatus = String(row.status ?? "present");
  const status: RollCallStatus =
    rawStatus === "absent" ||
    rawStatus === "late" ||
    rawStatus === "excused"
      ? rawStatus
      : "present";

  return {
    id: String(row.id),
    roll_date: String(row.roll_date ?? ""),
    student_id: String(row.student_id ?? ""),
    student_name: String(row.student_name ?? ""),
    status,
    note: typeof row.note === "string" ? row.note : null,
    recorded_by: typeof row.recorded_by === "string" ? row.recorded_by : null,
    created_at: String(row.created_at ?? ""),
  };
}

function mapIncidentRow(row: Record<string, unknown>): LessonIncident {
  const incidentType: LessonIncidentType =
    row.incident_type === "class_cancelled"
      ? "class_cancelled"
      : "teacher_noshow";

  return {
    id: String(row.id),
    incident_date: String(row.incident_date ?? ""),
    incident_type: incidentType,
    subject_name: String(row.subject_name ?? ""),
    teacher_name: typeof row.teacher_name === "string" ? row.teacher_name : null,
    period_label: typeof row.period_label === "string" ? row.period_label : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    recorded_by: typeof row.recorded_by === "string" ? row.recorded_by : null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function fetchAllRollCalls(): Promise<RollCallEntry[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("roll_calls")
        .select("*")
        .order("roll_date", { ascending: false })
        .order("student_name", { ascending: true })
        .limit(1000);

      if (!error && data) {
        return data.map((r) => mapRollCallRow(r as Record<string, unknown>));
      }
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  return [...store.rollCalls].sort((a, b) => {
    if (b.roll_date !== a.roll_date) return b.roll_date.localeCompare(a.roll_date);
    return a.student_name.localeCompare(b.student_name);
  });
}

export async function saveRollCallForDate(input: {
  rollDate: string;
  recordedBy: string;
  entries: {
    studentId: string;
    studentName: string;
    status: RollCallStatus;
    note?: string | null;
  }[];
}): Promise<RollCallEntry[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const rows = input.entries.map((e) => ({
        roll_date: input.rollDate,
        student_id: e.studentId,
        student_name: e.studentName,
        status: e.status,
        note: e.note?.trim() || null,
        recorded_by: input.recordedBy,
      }));

      const { data, error } = await supabase
        .from("roll_calls")
        .upsert(rows, { onConflict: "roll_date,student_id" })
        .select("*");

      if (!error && data) {
        return data.map((r) => mapRollCallRow(r as Record<string, unknown>));
      }
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  store.rollCalls = store.rollCalls.filter((r) => r.roll_date !== input.rollDate);

  const saved: RollCallEntry[] = input.entries.map((e) => ({
    id: generateId(),
    roll_date: input.rollDate,
    student_id: e.studentId,
    student_name: e.studentName,
    status: e.status,
    note: e.note?.trim() || null,
    recorded_by: input.recordedBy,
    created_at: nowIso,
  }));

  store.rollCalls.unshift(...saved);
  writeLocalStore(store);
  return saved;
}

export async function fetchAllLessonIncidents(): Promise<LessonIncident[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("lesson_incidents")
        .select("*")
        .order("incident_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && data) {
        return data.map((r) => mapIncidentRow(r as Record<string, unknown>));
      }
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  return [...store.lessonIncidents].sort((a, b) => {
    if (b.incident_date !== a.incident_date) {
      return b.incident_date.localeCompare(a.incident_date);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function createLessonIncident(input: {
  incidentDate: string;
  incidentType: LessonIncidentType;
  subjectName: string;
  teacherName?: string | null;
  periodLabel?: string | null;
  notes?: string | null;
  recordedBy: string;
}): Promise<LessonIncident> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("lesson_incidents")
        .insert({
          incident_date: input.incidentDate,
          incident_type: input.incidentType,
          subject_name: input.subjectName,
          teacher_name: input.teacherName ?? null,
          period_label: input.periodLabel ?? null,
          notes: input.notes ?? null,
          recorded_by: input.recordedBy,
        })
        .select("*")
        .single();

      if (!error && data) {
        return mapIncidentRow(data as Record<string, unknown>);
      }
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const created: LessonIncident = {
    id: generateId(),
    incident_date: input.incidentDate,
    incident_type: input.incidentType,
    subject_name: input.subjectName,
    teacher_name: input.teacherName ?? null,
    period_label: input.periodLabel ?? null,
    notes: input.notes ?? null,
    recorded_by: input.recordedBy,
    created_at: new Date().toISOString(),
  };
  store.lessonIncidents.unshift(created);
  writeLocalStore(store);
  return created;
}

export async function deleteLessonIncident(id: string): Promise<boolean> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("lesson_incidents")
        .delete()
        .eq("id", id);

      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const before = store.lessonIncidents.length;
  store.lessonIncidents = store.lessonIncidents.filter((i) => i.id !== id);
  writeLocalStore(store);
  return store.lessonIncidents.length < before;
}

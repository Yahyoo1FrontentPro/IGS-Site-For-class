import { AbsenceReport, AbsenceStatus } from "@/types";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function mapRow(row: Record<string, unknown>): AbsenceReport {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ""),
    username: String(row.username ?? "Student"),
    absence_date: String(row.absence_date ?? ""),
    reason: String(row.reason ?? ""),
    status:
      row.status === "acknowledged" ? "acknowledged" : ("pending" as AbsenceStatus),
    admin_note: typeof row.admin_note === "string" ? row.admin_note : null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function fetchAllAbsences(): Promise<AbsenceReport[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("absence_reports")
        .select("*")
        .order("absence_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        return data.map((row) => mapRow(row as Record<string, unknown>));
      }
    } catch {
      // Fallback to local store if table is not migrated yet
    }
  }

  const store = readLocalStore();
  return [...store.absences].sort((a, b) => {
    if (b.absence_date !== a.absence_date) {
      return b.absence_date.localeCompare(a.absence_date);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function fetchUserAbsences(userId: string, username: string): Promise<AbsenceReport[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("absence_reports")
        .select("*")
        .or(`user_id.eq.${userId},username.ilike.${username}`)
        .order("absence_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        return data.map((row) => mapRow(row as Record<string, unknown>));
      }
    } catch {
      // Fallback to local store
    }
  }

  const store = readLocalStore();
  const lower = username.toLowerCase();
  return store.absences
    .filter(
      (a) => a.user_id === userId || a.username.toLowerCase() === lower
    )
    .sort((a, b) => {
      if (b.absence_date !== a.absence_date) {
        return b.absence_date.localeCompare(a.absence_date);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export async function createAbsenceReport(input: {
  userId: string;
  username: string;
  absenceDate: string;
  reason: string;
}): Promise<AbsenceReport> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("absence_reports")
        .insert({
          user_id: input.userId,
          username: input.username,
          absence_date: input.absenceDate,
          reason: input.reason,
          status: "pending",
        })
        .select("*")
        .single();

      if (!error && data) {
        return mapRow(data as Record<string, unknown>);
      }
    } catch {
      // Fallback to local store
    }
  }

  const store = readLocalStore();
  const report: AbsenceReport = {
    id: generateId(),
    user_id: input.userId,
    username: input.username,
    absence_date: input.absenceDate,
    reason: input.reason,
    status: "pending",
    admin_note: null,
    created_at: new Date().toISOString(),
  };
  store.absences.unshift(report);
  writeLocalStore(store);
  return report;
}

export async function updateAbsenceStatus(input: {
  id: string;
  status: AbsenceStatus;
  adminNote?: string | null;
}): Promise<AbsenceReport | null> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const updates: Record<string, unknown> = { status: input.status };
      if (input.adminNote !== undefined) {
        updates.admin_note = input.adminNote;
      }

      const { data, error } = await supabase
        .from("absence_reports")
        .update(updates)
        .eq("id", input.id)
        .select("*")
        .single();

      if (!error && data) {
        return mapRow(data as Record<string, unknown>);
      }
    } catch {
      // Fallback to local store
    }
  }

  const store = readLocalStore();
  const target = store.absences.find((a) => a.id === input.id);
  if (!target) return null;
  target.status = input.status;
  if (input.adminNote !== undefined) {
    target.admin_note = input.adminNote;
  }
  writeLocalStore(store);
  return target;
}

export async function deleteAbsenceReport(id: string): Promise<boolean> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("absence_reports")
        .delete()
        .eq("id", id);

      if (!error) return true;
    } catch {
      // Fallback to local store
    }
  }

  const store = readLocalStore();
  const before = store.absences.length;
  store.absences = store.absences.filter((a) => a.id !== id);
  writeLocalStore(store);
  return store.absences.length < before;
}

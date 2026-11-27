import { HomeworkAssignment } from "@/types";
import { generateId, readLocalStore, writeLocalStore } from "@/lib/local-store";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function mapRow(row: Record<string, unknown>): HomeworkAssignment {
  return {
    id: String(row.id),
    subject_name: String(row.subject_name ?? "General"),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    due_date: String(row.due_date ?? ""),
    link_url: typeof row.link_url === "string" ? row.link_url : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function fetchAllHomework(): Promise<HomeworkAssignment[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("homework_assignments")
        .select("*")
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        return data.map((r) => mapRow(r as Record<string, unknown>));
      }
    } catch {
      // Fallback to local store
    }
  }

  const store = readLocalStore();
  return [...store.homeworkAssignments].sort((a, b) => {
    if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function createHomeworkAssignment(input: {
  subjectName: string;
  title: string;
  description: string;
  dueDate: string;
  linkUrl?: string | null;
  createdBy?: string | null;
}): Promise<HomeworkAssignment> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("homework_assignments")
        .insert({
          subject_name: input.subjectName,
          title: input.title,
          description: input.description,
          due_date: input.dueDate,
          link_url: input.linkUrl ?? null,
          created_by: input.createdBy ?? null,
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
  const created: HomeworkAssignment = {
    id: generateId(),
    subject_name: input.subjectName,
    title: input.title,
    description: input.description,
    due_date: input.dueDate,
    link_url: input.linkUrl ?? null,
    created_by: input.createdBy ?? null,
    created_at: new Date().toISOString(),
  };
  store.homeworkAssignments.unshift(created);
  writeLocalStore(store);
  return created;
}

export async function deleteHomeworkAssignment(id: string): Promise<boolean> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("homework_assignments")
        .delete()
        .eq("id", id);

      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const before = store.homeworkAssignments.length;
  store.homeworkAssignments = store.homeworkAssignments.filter((h) => h.id !== id);
  writeLocalStore(store);
  return store.homeworkAssignments.length < before;
}

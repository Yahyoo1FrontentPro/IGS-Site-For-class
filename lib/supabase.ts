import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  ClassSchedule,
  HubDataset,
  PointLog,
  Student,
  Subject,
  Week,
} from "@/types";
import { getLocalHubDataset } from "@/lib/local-store";

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  return (
    trimmed.length === 0 ||
    trimmed.includes("your-project-ref") ||
    trimmed.includes("your-supabase-")
  );
}

export function isSupabaseConfigured(): boolean {
  return (
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return (
    isSupabaseConfigured() &&
    !isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()
  );
}

export function getSupabaseServerReadClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey || isPlaceholder(url) || isPlaceholder(serviceKey)) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function fetchHubDataset(): Promise<HubDataset> {
  const client = getSupabaseServerReadClient();
  if (!client) {
    return getLocalHubDataset();
  }

  try {
    const [studentsRes, subjectsRes, weeksRes, logsRes, schedulesRes] =
      await Promise.all([
        client.from("students").select("id, name, is_active, created_at").order("name", { ascending: true }),
        client.from("subjects").select("*").order("sort_order", { ascending: true }),
        client.from("weeks").select("*").order("week_number", { ascending: true }),
        client
          .from("point_logs")
          .select("id, student_id, subject_id, week_id, points, category, reason, date, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
        client
          .from("schedules")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    const coreError =
      studentsRes.error || subjectsRes.error || weeksRes.error || logsRes.error;

    if (coreError) {
      return getLocalHubDataset();
    }

    const parsedSchedules: ClassSchedule[] =
      !schedulesRes.error && schedulesRes.data
        ? schedulesRes.data.map((row: Record<string, unknown>) => ({
            id: String(row.id),
            title: String(row.title ?? "Class Schedule"),
            image_url:
              typeof row.image_url === "string" ? row.image_url : null,
            entries: Array.isArray(row.entries)
              ? (row.entries as ClassSchedule["entries"])
              : [],
            is_active: Boolean(row.is_active),
            created_at: String(row.created_at ?? ""),
          }))
        : getLocalHubDataset().schedules;

    return {
      students: (studentsRes.data ?? []) as Student[],
      subjects: (subjectsRes.data ?? []) as Subject[],
      weeks: (weeksRes.data ?? []) as Week[],
      pointLogs: (logsRes.data ?? []) as PointLog[],
      schedules: parsedSchedules,
      isConfigured: true,
    };
  } catch {
    return getLocalHubDataset();
  }
}

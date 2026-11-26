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

// Default cloud database connection for IGS MYP 3 Activity Hub so Render deployments
// persist all data permanently in Supabase PostgreSQL across restarts even without manual env setup.
const DEFAULT_SUPABASE_URL = "https://kplkapmfvrocwejhmfap.supabase.co";
const DEFAULT_ANON_KEY = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbGthcG1mdnJvY3dlamhtZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTA2NjAsImV4cCI6MjExMTIyNjY2MH0",
  "CfMCu2RAp7JQ1rinQcCrsBtv7Gm5RGx4yGOpi-gRJy4",
].join(".");
const DEFAULT_SERVICE_KEY = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbGthcG1mdnJvY3dlamhtZmFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTY1MDY2MCwiZXhwIjoyMTExMjI2NjYwfQ",
  "71k6Tyuj4xgemLmtX_IOpwLkfYhVnO4Kck6GyI-2vK0",
].join(".");

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  return (
    trimmed.length === 0 ||
    trimmed.includes("your-project-ref") ||
    trimmed.includes("your-supabase-")
  );
}

function getEffectiveUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !isPlaceholder(envUrl) ? envUrl!.trim() : DEFAULT_SUPABASE_URL;
}

function getEffectiveAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !isPlaceholder(envKey) ? envKey!.trim() : DEFAULT_ANON_KEY;
}

function getEffectiveServiceKey(): string {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !isPlaceholder(envKey) ? envKey!.trim() : DEFAULT_SERVICE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getEffectiveUrl() && getEffectiveAnonKey());
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getEffectiveUrl() && getEffectiveServiceKey());
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return createClient(getEffectiveUrl(), getEffectiveAnonKey());
}

export function getSupabaseServerReadClient(): SupabaseClient | null {
  return createClient(getEffectiveUrl(), getEffectiveAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAdminClient(): SupabaseClient {
  return createClient(getEffectiveUrl(), getEffectiveServiceKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function fetchHubDataset(): Promise<HubDataset> {
  const client = getSupabaseAdminClient();

  try {
    const [studentsRes, subjectsRes, weeksRes, logsRes, schedulesRes] =
      await Promise.all([
        client
          .from("students")
          .select("id, name, is_active, created_at")
          .order("name", { ascending: true }),
        client
          .from("subjects")
          .select("*")
          .order("sort_order", { ascending: true }),
        client
          .from("weeks")
          .select("*")
          .order("week_number", { ascending: true }),
        client
          .from("point_logs")
          .select(
            "id, student_id, subject_id, week_id, points, category, reason, date, created_at"
          )
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

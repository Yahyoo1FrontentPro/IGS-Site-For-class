import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { HubDataset, PointLog, Student, Subject, Team, TeamBonus, Week } from "@/types";
import { getSeedPreviewDataset } from "@/lib/seed-preview";

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
    throw new Error(
      "Supabase server credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
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
    return getSeedPreviewDataset(
      "Supabase environment variables are not configured yet. Showing pre-seeded MYP 3 roster preview — configure .env.local and run schema.sql to enable live database storage."
    );
  }

  try {
    const [
      teamsRes,
      studentsRes,
      subjectsRes,
      weeksRes,
      logsRes,
      bonusesRes,
    ] = await Promise.all([
      client.from("teams").select("*").order("sort_order", { ascending: true }),
      client.from("students").select("*").order("name", { ascending: true }),
      client.from("subjects").select("*").order("sort_order", { ascending: true }),
      client.from("weeks").select("*").order("week_number", { ascending: true }),
      client
        .from("point_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      client
        .from("team_bonuses")
        .select("*")
        .order("date", { ascending: false })
        .limit(1000),
    ]);

    const firstError =
      teamsRes.error ||
      studentsRes.error ||
      subjectsRes.error ||
      weeksRes.error ||
      logsRes.error ||
      bonusesRes.error;

    if (firstError) {
      return getSeedPreviewDataset(
        `Database query failed (${firstError.message}). Make sure you ran schema.sql in the Supabase SQL Editor.`
      );
    }

    return {
      teams: (teamsRes.data ?? []) as Team[],
      students: (studentsRes.data ?? []) as Student[],
      subjects: (subjectsRes.data ?? []) as Subject[],
      weeks: (weeksRes.data ?? []) as Week[],
      pointLogs: (logsRes.data ?? []) as PointLog[],
      teamBonuses: (bonusesRes.data ?? []) as TeamBonus[],
      isConfigured: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected database error";
    return getSeedPreviewDataset(`Could not reach Supabase (${message}).`);
  }
}

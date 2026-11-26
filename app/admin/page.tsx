import { getSessionUser } from "@/lib/auth";
import { fetchAllAbsences } from "@/lib/absences";
import { getElectionState } from "@/lib/elections";
import { readLocalStore, toUserSummary } from "@/lib/local-store";
import {
  fetchHubDataset,
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase";
import { AdminLoginClient } from "@/components/AdminLoginClient";
import { AdminPanelClient } from "@/components/AdminPanelClient";
import { AppUserSummary } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const sessionUser = getSessionUser();

  if (!sessionUser || sessionUser.role !== "admin") {
    return <AdminLoginClient currentUser={sessionUser} />;
  }

  let appUsers: AppUserSummary[] = [];
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const res = await supabase
        .from("app_users")
        .select("id, username, phone, role, role_title, created_at")
        .order("created_at", { ascending: true });

      if (!res.error && res.data) {
        appUsers = res.data as AppUserSummary[];
      } else {
        const fallback = await supabase
          .from("app_users")
          .select("id, username, phone, role, created_at")
          .order("created_at", { ascending: true });
        appUsers = (fallback.data ?? []) as AppUserSummary[];
      }
    } catch {
      appUsers = readLocalStore().appUsers.map(toUserSummary);
    }
  } else {
    appUsers = readLocalStore().appUsers.map(toUserSummary);
  }

  const initialTab =
    searchParams?.tab === "schedules"
      ? "schedules"
      : searchParams?.tab === "voting"
      ? "voting"
      : searchParams?.tab === "absences"
      ? "absences"
      : searchParams?.tab === "manage"
      ? "manage"
      : "daily";

  const [dataset, initialElection, initialAbsences] = await Promise.all([
    fetchHubDataset(),
    getElectionState(sessionUser),
    fetchAllAbsences(),
  ]);

  return (
    <AdminPanelClient
      initialDataset={dataset}
      currentUser={sessionUser}
      initialAppUsers={appUsers}
      initialTab={initialTab}
      initialElection={initialElection}
      initialAbsences={initialAbsences}
    />
  );
}

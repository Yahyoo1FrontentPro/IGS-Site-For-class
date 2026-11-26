import { getSessionUser } from "@/lib/auth";
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
      const { data } = await supabase
        .from("app_users")
        .select("id, username, phone, role, created_at")
        .order("created_at", { ascending: true });
      appUsers = (data ?? []) as AppUserSummary[];
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
      : searchParams?.tab === "manage"
      ? "manage"
      : "daily";

  const [dataset, initialElection] = await Promise.all([
    fetchHubDataset(),
    getElectionState(sessionUser),
  ]);
  return (
    <AdminPanelClient
      initialDataset={dataset}
      currentUser={sessionUser}
      initialAppUsers={appUsers}
      initialTab={initialTab}
      initialElection={initialElection}
    />
  );
}

import { getSessionUser } from "@/lib/auth";
import { fetchHubDataset, getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";
import { AdminLoginClient } from "@/components/AdminLoginClient";
import { AdminPanelClient } from "@/components/AdminPanelClient";
import { AppUserSummary } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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
      appUsers = [];
    }
  }

  const dataset = await fetchHubDataset();
  return (
    <AdminPanelClient
      initialDataset={dataset}
      currentUser={sessionUser}
      initialAppUsers={appUsers}
    />
  );
}

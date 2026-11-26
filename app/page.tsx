import { getSessionUser } from "@/lib/auth";
import { fetchHubDataset } from "@/lib/supabase";
import { PublicDashboardClient } from "@/components/PublicDashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dataset, sessionUser] = await Promise.all([
    fetchHubDataset(),
    Promise.resolve(getSessionUser()),
  ]);

  return <PublicDashboardClient dataset={dataset} sessionUser={sessionUser} />;
}

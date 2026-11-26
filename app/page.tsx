import { getSessionUser } from "@/lib/auth";
import { getElectionState } from "@/lib/elections";
import { fetchHubDataset } from "@/lib/supabase";
import { PublicDashboardClient } from "@/components/PublicDashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = getSessionUser();
  const [dataset, electionState] = await Promise.all([
    fetchHubDataset(),
    getElectionState(sessionUser),
  ]);

  return (
    <PublicDashboardClient
      dataset={dataset}
      sessionUser={sessionUser}
      electionState={electionState}
    />
  );
}

import { getSessionUser } from "@/lib/auth";
import { fetchHubDataset } from "@/lib/supabase";
import { ScheduleViewer } from "@/components/ScheduleViewer";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const [dataset, sessionUser] = await Promise.all([
    fetchHubDataset(),
    Promise.resolve(getSessionUser()),
  ]);

  return (
    <ScheduleViewer
      schedules={dataset.schedules}
      sessionUser={sessionUser}
      standalone={true}
    />
  );
}

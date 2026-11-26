import { fetchHubDataset } from "@/lib/supabase";
import { ClassroomTvClient } from "@/components/ClassroomTvClient";

export const dynamic = "force-dynamic";

export default async function ClassroomTvPage() {
  const dataset = await fetchHubDataset();
  return <ClassroomTvClient dataset={dataset} />;
}

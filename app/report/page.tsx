import { fetchHubDataset } from "@/lib/supabase";
import { WeeklyReportClient } from "@/components/WeeklyReportClient";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams?: { week?: string };
}) {
  const dataset = await fetchHubDataset();
  return <WeeklyReportClient dataset={dataset} initialWeekId={searchParams?.week} />;
}

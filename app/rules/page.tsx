import { getSessionUser } from "@/lib/auth";
import { RulesAndDutyClient } from "@/components/RulesAndDutyClient";

export const dynamic = "force-dynamic";

export default function RulesPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const sessionUser = getSessionUser();
  const initialView =
    searchParams?.view === "rules"
      ? "rules"
      : searchParams?.view === "duty"
      ? "duty"
      : "all";

  return (
    <RulesAndDutyClient sessionUser={sessionUser} initialView={initialView} />
  );
}

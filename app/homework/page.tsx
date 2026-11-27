import { getSessionUser } from "@/lib/auth";
import { fetchAllHomework } from "@/lib/homework";
import { HomeworkPageClient } from "@/components/HomeworkPageClient";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
  const [homework, sessionUser] = await Promise.all([
    fetchAllHomework(),
    Promise.resolve(getSessionUser()),
  ]);

  return (
    <HomeworkPageClient
      initialHomework={homework}
      sessionUser={sessionUser}
    />
  );
}

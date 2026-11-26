import { getSessionUser } from "@/lib/auth";
import { fetchUserAbsences } from "@/lib/absences";
import { AbsencePageClient } from "@/components/AbsencePageClient";

export const dynamic = "force-dynamic";

export default async function AbsencePage() {
  const sessionUser = getSessionUser();
  const initialAbsences = sessionUser
    ? await fetchUserAbsences(sessionUser.id, sessionUser.username)
    : [];

  return (
    <AbsencePageClient
      sessionUser={sessionUser}
      initialAbsences={initialAbsences}
    />
  );
}

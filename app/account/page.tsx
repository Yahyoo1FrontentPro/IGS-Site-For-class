import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AccountSettingsClient } from "@/components/AccountSettingsClient";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  const user = getSessionUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  return <AccountSettingsClient user={user} />;
}

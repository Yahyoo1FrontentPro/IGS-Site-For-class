import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthFormClient } from "@/components/AuthFormClient";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const user = getSessionUser();
  if (user) {
    if (searchParams?.next) {
      redirect(searchParams.next);
    }
    redirect(user.role === "admin" ? "/admin" : "/");
  }

  return <AuthFormClient mode="login" redirectTo={searchParams?.next} />;
}

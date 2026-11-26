import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthFormClient } from "@/components/AuthFormClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const user = getSessionUser();
  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/");
  }

  return <AuthFormClient mode="register" />;
}

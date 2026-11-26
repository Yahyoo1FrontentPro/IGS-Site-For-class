"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, ShieldAlert } from "lucide-react";
import { SessionUser } from "@/types";
import { AuthFormClient } from "@/components/AuthFormClient";

export function AdminLoginClient({
  currentUser,
}: {
  currentUser?: SessionUser | null;
}) {
  const router = useRouter();

  if (!currentUser) {
    return <AuthFormClient mode="login" redirectTo="/admin" adminNotice={true} />;
  }

  const handleSwitchAccount = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login?next=/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-navy-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-navy-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          Admin Permission Required
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          You are currently signed in as{" "}
          <strong className="text-slate-900 dark:text-white">
            @{currentUser.username}
          </strong>{" "}
          (Student Account). Only Class Leader Admin accounts can award or manage house points.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <LogOut className="h-4 w-4" />
            Switch to Admin Account
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-navy-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Public Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

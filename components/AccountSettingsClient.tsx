"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { SessionUser } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AccountSettingsClient({ user }: { user: SessionUser }) {
  const router = useRouter();

  const [phone, setPhone] = useState(user.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSavingPhone(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = (await res.json()) as { updated?: boolean; error?: string };
      if (!res.ok || !data.updated) {
        setMessage({ type: "error", text: data.error ?? "Could not save phone number." });
        return;
      }
      setMessage({
        type: "success",
        text: "Phone number saved! You can now log in with either your phone number or username.",
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error while saving phone number." });
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = (await res.json()) as { updated?: boolean; error?: string };
      if (!res.ok || !data.updated) {
        setMessage({
          type: "error",
          text: data.error ?? "Could not update password.",
        });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({
        type: "success",
        text: "Your password has been updated successfully!",
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error while updating password." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-navy-900">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-navy-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Public Hub
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-700 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Console
            </Link>
          )}
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-navy-900">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-blue-600 text-white">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  @{user.username}
                </h1>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {user.role === "admin" ? "Class Leader Admin" : "MYP 3 Student"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your phone number and change your password anytime.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`mt-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
              }`}
            >
              {message.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Phone Number Form */}
          <form onSubmit={handleSavePhone} className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Your Phone Number
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Link your phone number to sign in using either your phone or @{user.username}.
            </p>
            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={savingPhone}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Phone"}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="mt-6 space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Change Password
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Default student password is <code className="font-mono">12345678</code> until you change it here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Show
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                New Password
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 py-3 text-sm font-bold text-white shadow hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Save New Password"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

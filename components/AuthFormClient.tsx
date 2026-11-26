"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { SessionUser } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthFormClientProps {
  mode: "login" | "register";
  redirectTo?: string;
  adminNotice?: boolean;
}

export function AuthFormClient({
  mode,
  redirectTo,
  adminNotice = false,
}: AuthFormClientProps) {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { identifier: identifier.trim(), password }
          : { phone: phone.trim(), username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { user?: SessionUser; error?: string };

      if (!res.ok || !data.user) {
        setError(data.error ?? "Authentication failed. Please check your details.");
        setLoading(false);
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("Network error. Please check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-navy-950">
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 sm:text-sm dark:border-slate-800 dark:bg-navy-900 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Hub
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-navy-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-blue-600 text-white shadow-md">
            {adminNotice ? (
              <ShieldCheck className="h-7 w-7" />
            ) : mode === "login" ? (
              <LogIn className="h-7 w-7" />
            ) : (
              <UserPlus className="h-7 w-7" />
            )}
          </div>

          <div className="mt-5 text-center">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {adminNotice
                ? "Admin & Class Login"
                : mode === "login"
                ? "Log In to MYP 3 Hub"
                : "Create Class Account"}
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Sign in with your Phone Number or Username and Password"
                : "International GoldStars School • MYP 3 Activity Hub"}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="mt-6 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-navy-950">
            <Link
              href={redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login"}
              className={`rounded-lg py-2 text-center text-xs font-bold transition ${
                mode === "login"
                  ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Log In
            </Link>
            <Link
              href="/register"
              className={`rounded-lg py-2 text-center text-xs font-bold transition ${
                mode === "register"
                  ? "bg-white text-navy-900 shadow-sm dark:bg-blue-600 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Register
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "login" ? (
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Your Phone Number or Username
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. +998901234567 or Username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Your Phone Number
                  </label>
                  <div className="relative mt-1.5">
                    <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      autoFocus
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-username"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Username
                  </label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={30}
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username (e.g. Ali_MYP3)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "register" ? 6 : 1}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "login"
                      ? "Enter your password"
                      : "Create password (min. 6 characters)"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-2.5 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 py-3 text-sm font-bold text-white shadow-md transition hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Log In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

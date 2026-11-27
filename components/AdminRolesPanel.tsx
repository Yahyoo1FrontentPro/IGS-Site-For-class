"use client";

import React, { useState } from "react";
import {
  Award,
  Check,
  Edit3,
  Loader2,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { AppUserSummary, SessionUser, UserRole } from "@/types";
import { useLanguage } from "@/components/LanguageProvider";

interface AdminRolesPanelProps {
  currentUser: SessionUser;
  appUsers: AppUserSummary[];
  onUsersChange: (next: AppUserSummary[]) => void;
  myPhoneInput: string;
  onMyPhoneInputChange: (val: string) => void;
  savingPhone: boolean;
  onSaveMyPhone: (e: React.FormEvent) => void;
  onResetPassword: (user: AppUserSummary) => void;
  onNotify: (msg: {
    title: string;
    subtitle?: string;
    variant: "success" | "warning" | "error";
  }) => void;
}

const TITLE_PRESETS = [
  "Class Leader",
  "Co-Leader",
  "Deputy Admin",
  "Duty Manager",
  "Attendance Monitor",
  "Scorekeeper",
  "Secretary",
];

export function AdminRolesPanel({
  currentUser,
  appUsers,
  onUsersChange,
  myPhoneInput,
  onMyPhoneInputChange,
  savingPhone,
  onSaveMyPhone,
  onResetPassword,
  onNotify,
}: AdminRolesPanelProps) {
  const { t } = useLanguage();
  // Form A: Assign role & title to existing account
  const [selectedUserId, setSelectedUserId] = useState<string>(
    () => appUsers[0]?.id ?? ""
  );
  const [assignRole, setAssignRole] = useState<UserRole>(
    () => appUsers[0]?.role ?? "admin"
  );
  const [assignTitle, setAssignTitle] = useState<string>(
    () => appUsers[0]?.role_title ?? ""
  );
  const [savingExisting, setSavingExisting] = useState<boolean>(false);

  // Form B: Create new user with role & title
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPhone, setNewPhone] = useState<string>("");
  const [newRole, setNewRole] = useState<UserRole>("admin");
  const [newTitle, setNewTitle] = useState<string>("");
  const [creatingUser, setCreatingUser] = useState<boolean>(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSelectExistingUser = (userId: string) => {
    setSelectedUserId(userId);
    const found = appUsers.find((u) => u.id === userId);
    if (found) {
      setAssignRole(found.role);
      setAssignTitle(found.role_title ?? "");
    }
  };

  const handleAssignExistingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const target = appUsers.find((u) => u.id === selectedUserId);
    setSavingExisting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          role: assignRole,
          roleTitle: assignTitle.trim(),
        }),
      });

      const data = (await res.json()) as {
        user?: AppUserSummary;
        warning?: string;
        error?: string;
      };

      if (!res.ok || !data.user) {
        onNotify({
          title: "Could not assign role",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      onUsersChange(
        appUsers.map((u) => (u.id === data.user!.id ? data.user! : u))
      );
      onNotify({
        title: `Updated @${data.user.username}`,
        subtitle:
          data.warning ??
          `${data.user.role === "admin" ? "Admin" : "Student"}${
            data.user.role_title ? ` • ${data.user.role_title}` : ""
          }`,
        variant: data.warning ? "warning" : "success",
      });
    } catch {
      onNotify({
        title: `Network error updating ${target?.username ?? "account"}`,
        variant: "error",
      });
    } finally {
      setSavingExisting(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim() || "12345678",
          phone: newPhone.trim() || undefined,
          role: newRole,
          roleTitle: newTitle.trim() || undefined,
        }),
      });

      const data = (await res.json()) as {
        user?: AppUserSummary;
        warning?: string;
        error?: string;
      };

      if (!res.ok || !data.user) {
        onNotify({
          title: "Could not create user",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }

      onUsersChange([...appUsers, data.user]);
      setNewUsername("");
      setNewPassword("");
      setNewPhone("");
      setNewTitle("");
      onNotify({
        title: `Created @${data.user.username}`,
        subtitle:
          data.warning ??
          `Role: ${data.user.role === "admin" ? "Admin" : "Student"}${
            data.user.role_title ? ` • ${data.user.role_title}` : ""
          }`,
        variant: data.warning ? "warning" : "success",
      });
    } catch {
      onNotify({
        title: "Network error creating user",
        variant: "error",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (user: AppUserSummary) => {
    if (
      !window.confirm(
        `Delete account @${user.username}? They will no longer be able to log in.`
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    try {
      const res = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(user.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { deleted?: boolean; error?: string };
      if (!res.ok) {
        onNotify({
          title: "Could not delete user",
          subtitle: data.error,
          variant: "error",
        });
        return;
      }
      onUsersChange(appUsers.filter((u) => u.id !== user.id));
      onNotify({
        title: `Deleted account @${user.username}`,
        variant: "warning",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const selectedIsOwner =
    appUsers
      .find((u) => u.id === selectedUserId)
      ?.username.toLowerCase() === "yahyoo_erikovich";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-900">
      {/* Section Header + Admin Phone */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {t.rolesTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.rolesSubtitle}
            </p>
          </div>
        </div>

        <form
          onSubmit={onSaveMyPhone}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="tel"
              value={myPhoneInput}
              onChange={(e) => onMyPhoneInputChange(e.target.value)}
              placeholder="Your phone (+998...)"
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium dark:border-slate-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={savingPhone}
            className="rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {savingPhone ? "Saving..." : "Save My Phone"}
          </button>
        </form>
      </div>

      {/* Two Action Cards: Assign to Existing vs Add New User */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1: Assign Role to Existing Account */}
        <form
          onSubmit={handleAssignExistingSubmit}
          className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-navy-950/60"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Assign Role to Existing Account
              </h3>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Existing User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleSelectExistingUser(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
              >
                {appUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    @{u.username} — {u.role === "admin" ? "Admin" : "Student"}
                    {u.role_title ? ` (${u.role_title})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Access Level
                </label>
                <select
                  value={assignRole}
                  disabled={selectedIsOwner}
                  onChange={(e) => setAssignRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                >
                  <option value="admin">Admin (Full Console)</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Specific Role Title
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Co-Leader, Duty Manager..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TITLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAssignTitle(preset)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-300"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingExisting || !selectedUserId}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-navy-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-navy-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {savingExisting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save Role &amp; Title
          </button>
        </form>

        {/* Card 2: Add New User & Assign Role */}
        <form
          onSubmit={handleCreateUserSubmit}
          className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-navy-950/60"
        >
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Add New User &amp; Assign Role
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. Fazliya_Admin"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password (blank = 12345678)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Default: 12345678"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Access Level
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Role Title
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Co-Leader"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+998..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingUser || newUsername.trim().length < 3}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {creatingUser ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create User &amp; Assign Role
          </button>
        </form>
      </div>

      {/* All Accounts Table */}
      <div className="mt-6 overflow-x-auto">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" />
            All Accounts ({appUsers.length})
          </p>
        </div>

        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
              <th className="py-2.5 pr-3">Username</th>
              <th className="py-2.5 px-3">Role &amp; Title</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {appUsers.map((u) => {
              const isOwner = u.username.toLowerCase() === "yahyoo_erikovich";
              const isSelf = u.id === currentUser.id;
              return (
                <tr key={u.id}>
                  <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white">
                    @{u.username}
                    {isSelf && (
                      <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.role === "admin"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Student"}
                      </span>
                      {u.role_title && (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {u.role_title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {u.phone ?? "Not set"}
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectExistingUser(u.id)}
                        title="Edit role & custom title"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-navy-800"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit Role
                      </button>

                      {!isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => onResetPassword(u)}
                            title="Reset password back to 12345678"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-navy-800"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset PW
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              disabled={deletingId === u.id}
                              onClick={() => handleDeleteUser(u)}
                              title="Delete account"
                              className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

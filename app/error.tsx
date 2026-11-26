"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-navy-950 p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-900/50 dark:bg-navy-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {error.message || "An unexpected error occurred while loading MYP 3 Activity Hub."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-navy-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-200/80 dark:bg-navy-800/70" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-44 rounded-2xl bg-slate-200/80 dark:bg-navy-800/70" />
          <div className="h-44 rounded-2xl bg-slate-200/80 dark:bg-navy-800/70" />
          <div className="h-44 rounded-2xl bg-slate-200/80 dark:bg-navy-800/70" />
        </div>
        <div className="h-80 rounded-2xl bg-slate-200/80 dark:bg-navy-800/70" />
      </div>
    </div>
  );
}

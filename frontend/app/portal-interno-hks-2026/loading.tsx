export default function PortalLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="h-10 w-32 rounded-lg bg-white/5" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <div className="h-4 w-24 rounded bg-white/5 mb-4" />
            <div className="h-8 w-32 rounded bg-white/5 mb-2" />
            <div className="h-3 w-full rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <div className="h-6 w-48 rounded bg-white/5 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-1/4 rounded bg-white/5" />
              <div className="h-4 w-1/3 rounded bg-white/5" />
              <div className="h-4 w-1/6 rounded bg-white/5" />
              <div className="h-4 w-1/4 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

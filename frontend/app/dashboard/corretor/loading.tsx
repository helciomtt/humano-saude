export default function CorretorLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Profile header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-white/5" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-white/5" />
          <div className="h-4 w-56 rounded bg-white/5" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="h-4 w-20 rounded bg-white/5 mb-3" />
            <div className="h-8 w-24 rounded bg-white/5 mb-1" />
            <div className="h-3 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="h-5 w-36 rounded bg-white/5 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="h-5 w-36 rounded bg-white/5 mb-4" />
          <div className="h-48 w-full rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

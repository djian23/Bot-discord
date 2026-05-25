export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-lg" />
      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <div className="h-12 bg-white/5 border-b border-white/5" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
            <div className="h-3 w-24 bg-white/5 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
            <div className="h-3 flex-1 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-32 bg-discord-darker border border-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

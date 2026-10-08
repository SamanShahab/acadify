export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="glass-card p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-2/3'}`} />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-1/3" />
    </div>
  );
}

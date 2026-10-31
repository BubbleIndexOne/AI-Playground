interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-raised border border-subtle/50 ${className}`}
    />
  );
}

export function CardGridSkeleton({ count = 4 }: { readonly count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-subtle bg-card p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="pt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  readonly rows?: number;
  readonly columns?: number;
}) {
  return (
    <div className="rounded-xl border border-subtle bg-card overflow-hidden">
      <div className="border-b border-subtle bg-raised/50 px-4 py-3 grid grid-cols-5 gap-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <Skeleton key={idx} className="h-3.5 w-20" />
        ))}
      </div>
      <div className="divide-y divide-subtle">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-4 py-3.5 grid grid-cols-5 gap-4">
            {Array.from({ length: columns }).map((__, cIdx) => (
              <Skeleton key={cIdx} className="h-4 w-full max-w-[140px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

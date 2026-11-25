import { Card } from './Card'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-line ${className}`} />
}

// Betöltés közben a lista-sorok helye (avatar · cím · meta)
export function SkeletonList({ rows = 3, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <Card className="py-0" aria-busy="true" aria-label="Betöltés">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
          {avatar && <Skeleton className="size-10 shrink-0 rounded-full" />}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  )
}

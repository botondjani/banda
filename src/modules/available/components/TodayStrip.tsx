import { Link } from 'react-router'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Avatar } from '../../../ui/Avatar'
import { useActivePings } from '../api'

// "Ma ráérnek" sáv a feed tetején
export function TodayStrip() {
  const { group } = useGroup()
  const { data: pings = [] } = useActivePings(group.id)
  if (pings.length === 0) return null
  // személyenként egyszer, a címkéi összevonva
  const people = [...new Map(pings.map((p) => [p.user_id, p])).values()].map((p) => ({
    ...p,
    tags: [...new Set(pings.filter((q) => q.user_id === p.user_id).map((q) => q.tag))].join(', '),
  }))

  return (
    <Link to="/m/available" aria-label={`Ma ráérnek: ${people.map((p) => `${p.user?.display_name} (${p.tags})`).join(', ')}`} className="-mx-5 flex flex-col gap-2 border-b border-line px-5 pt-2 pb-4 transition-opacity duration-150 active:opacity-60">
      <span className="text-sm font-semibold text-muted">Ma ráérnek</span>
      <span className="flex gap-4 overflow-x-auto">
        {people.map((p) =>
          p.user ? (
            <span key={p.id} className="flex w-14 shrink-0 flex-col items-center gap-1">
              <Avatar name={p.user.display_name} color={p.user.color} src={p.user.avatar_url ?? undefined} />
              <span className="w-full truncate text-center text-xs font-semibold">{p.tags}</span>
            </span>
          ) : null,
        )}
      </span>
    </Link>
  )
}

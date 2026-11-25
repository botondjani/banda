import { Link } from 'react-router'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Avatar } from '../../../ui/Avatar'
import { useActivePings } from '../api'

// "Ma ráérnek" sáv a feed tetején
export function TodayStrip() {
  const { group } = useGroup()
  const { data: pings = [] } = useActivePings(group.id)
  if (pings.length === 0) return null

  return (
    <Link to="/m/available" className="-mx-5 flex flex-col gap-2 border-b border-line px-5 pt-2 pb-4">
      <span className="text-sm font-semibold text-muted">Ma ráérnek</span>
      <span className="flex gap-4 overflow-x-auto">
        {pings.map((p) =>
          p.user ? (
            <span key={p.id} className="flex w-14 shrink-0 flex-col items-center gap-1">
              <Avatar name={p.user.display_name} color={p.user.color} src={p.user.avatar_url ?? undefined} />
              <span className="w-full truncate text-center text-xs font-semibold">{p.tag}</span>
            </span>
          ) : null,
        )}
      </span>
    </Link>
  )
}

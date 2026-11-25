import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { useActivePings } from '../api'
import { PingAction } from './PingAction'

type Payload = { tag?: string; note?: string | null }

export function PingFeed({ item }: { item: FeedItem }) {
  const { group } = useGroup()
  const ping = useActivePings(group.id).data?.find((p) => p.id === item.ref_id)
  const p = item.payload as Payload

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p>
          <span className="font-semibold">{item.actor?.display_name}</span> ráér ma: <span className="font-semibold">{p.tag}</span>
        </p>
        {p.note && <p className="text-muted">{p.note}</p>}
        {ping && ping.ping_joins.length > 0 && (
          <p className="text-sm text-muted">Benne: {ping.ping_joins.map((j) => j.user?.display_name).join(', ')}</p>
        )}
      </div>
      {ping && <PingAction ping={ping} />}
    </div>
  )
}

export function PingJoinedFeed({ item }: { item: FeedItem }) {
  const p = item.payload as Payload
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> is benne:{' '}
      <Link to={`/programs/${item.ref_id}`} className="font-semibold underline underline-offset-4">
        {p.tag}
      </Link>
    </p>
  )
}

import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'
import { useMembers } from '../../../core/groups/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { formatFt } from '../../../lib/format'

type Payload = { title?: string; amount?: number; from?: string; to?: string }

export function ExpenseFeed({ item }: { item: FeedItem }) {
  const p = item.payload as Payload
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> kifizette:{' '}
      <Link to="/m/money" className="font-semibold underline underline-offset-4">{p.title}</Link>{' '}
      <span className="font-display font-semibold tabular-nums">{formatFt(p.amount ?? 0)}</span>
    </p>
  )
}

export function SettledFeed({ item }: { item: FeedItem }) {
  const { group } = useGroup()
  const { data: members = [] } = useMembers(group.id)
  const p = item.payload as Payload
  const name = (id?: string) => members.find((m) => m.user?.id === id)?.user?.display_name ?? '?'
  return (
    <p>
      <span className="font-semibold">{name(p.from)}</span> rendezte <span className="font-semibold">{name(p.to)}</span> felé:{' '}
      <span className="font-display font-semibold tabular-nums">{formatFt(p.amount ?? 0)}</span>
    </p>
  )
}

import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'

export function ItemFeed({ item }: { item: FeedItem }) {
  const p = item.payload as { title?: string; list?: string }
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> ajánlja:{' '}
      <Link to={`/m/lists?list=${item.ref_id}`} className="font-semibold underline underline-offset-4">{p.title}</Link>{' '}
      <span className="text-muted">({p.list})</span>
    </p>
  )
}

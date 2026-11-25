import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'

export function MemoryFeed({ item }: { item: FeedItem }) {
  const p = item.payload as { title?: string; count?: number; photos?: number }
  const link = <Link to={`/programs/${item.ref_id}`} className="font-semibold underline underline-offset-4">{p.title}</Link>
  if (item.type === 'one_year_ago')
    return <p>Egy éve ma: {link}{p.photos ? ` – ${p.photos} fotó vár` : ''}. Emlékszel?</p>
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> feltöltött {p.count} fotót: {link}
    </p>
  )
}

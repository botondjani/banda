import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'

export function BetFeed({ item }: { item: FeedItem }) {
  const p = item.payload as { title?: string; side?: string }
  const link = <Link to="/m/bets" className="font-semibold underline underline-offset-4">{p.title}</Link>
  if (item.type === 'bet_resolved')
    return <p>Eldőlt a fogadás: {link} – <span className="font-semibold">{p.side}</span> nyert.</p>
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> {item.type === 'bet_won' ? 'megnyerte:' : 'fogadást ajánlott:'} {link}
    </p>
  )
}

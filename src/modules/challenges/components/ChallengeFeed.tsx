import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'

const VERBS: Record<string, string> = {
  challenge_created: 'új kihívást indított:',
  challenge_submitted: 'beküldte a bizonyítékot:',
  challenge_completed: 'teljesítette a kihívást:',
}

export function ChallengeFeed({ item }: { item: FeedItem }) {
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> {VERBS[item.type]}{' '}
      <Link to="/m/challenges" className="font-semibold underline underline-offset-4">{(item.payload as { title?: string }).title}</Link>
    </p>
  )
}

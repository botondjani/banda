import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'

const title = (item: FeedItem) => (item.payload as { title?: string }).title

export function IdeaAddedFeed({ item }: { item: FeedItem }) {
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> ötletet dobott be:{' '}
      <Link to="/m/ideas" className="font-semibold underline underline-offset-4">{title(item)}</Link>
    </p>
  )
}

export function IdeaPlannedFeed({ item }: { item: FeedItem }) {
  return (
    <p>
      Összejött:{' '}
      <Link to={`/programs/${item.ref_id}`} className="font-semibold underline underline-offset-4">{title(item)}</Link>. Lesz belőle program
      {' – '}
      <span className="font-semibold">{item.actor?.display_name}</span> szavazata döntött.
    </p>
  )
}

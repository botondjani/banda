import { Link } from 'react-router'
import type { FeedItem } from '../../../core/feed/api'

const VERB: Record<string, string> = {
  item_added: 'kölcsönadná:',
  loan_requested: 'elkérné:',
  loan_approved: 'kölcsönadta:',
  loan_declined: 'most nem adja oda:',
  loan_returned: 'visszakapta:',
}

export function LendingFeed({ item }: { item: FeedItem }) {
  const p = item.payload as { name?: string; borrower?: string }
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> {VERB[item.type]}{' '}
      <Link to="/m/lending" className="font-semibold underline underline-offset-4">{p.name}</Link>
      {p.borrower && (item.type === 'loan_approved' || item.type === 'loan_returned') && <span className="text-muted"> ({p.borrower})</span>}
    </p>
  )
}

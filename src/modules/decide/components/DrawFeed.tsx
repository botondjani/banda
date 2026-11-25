import type { FeedItem } from '../../../core/feed/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { describeDraw, useDraws } from '../api'

// Az eredményt a draws táblából olvassuk (oda csak a szerver ír), nem a payloadból
export function DrawFeed({ item }: { item: FeedItem }) {
  const { group } = useGroup()
  const draw = useDraws(group.id).data?.find((d) => d.id === item.ref_id)
  return (
    <p>
      <span className="font-semibold">{item.actor?.display_name}</span> {draw ? describeDraw(draw.kind, draw.result, draw.options) : 'sorsolt valamit'}
    </p>
  )
}

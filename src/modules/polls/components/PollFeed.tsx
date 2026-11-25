import type { FeedItem } from '../../../core/feed/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { usePolls } from '../api'
import { PollCard } from './PollCard'

// A feedben közvetlenül lehet szavazni
export function PollFeed({ item }: { item: FeedItem }) {
  const { group } = useGroup()
  const poll = usePolls(group.id).data?.find((p) => p.id === item.ref_id)
  return (
    <div className="flex flex-col gap-2">
      <p>
        <span className="font-semibold">{item.actor?.display_name}</span> szavazást indított
      </p>
      {poll ? <PollCard poll={poll} /> : <p className="font-semibold">{(item.payload as { question?: string }).question}</p>}
    </div>
  )
}

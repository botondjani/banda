import { useState } from 'react'
import { useGroup } from '../../core/groups/GroupProvider'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { SkeletonList } from '../../ui/Skeleton'
import { isOpen, usePolls } from './api'
import { NewPollSheet } from './components/NewPollSheet'
import { PollCard } from './components/PollCard'

export function PollsPage() {
  const { group } = useGroup()
  const { data: polls } = usePolls(group.id)
  const [open, setOpen] = useState(false)
  const live = polls?.filter(isOpen) ?? []
  const closed = polls?.filter((p) => !isOpen(p)) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Szavazás</h1>
        <p className="mt-1 text-muted">Hova, mikor, mit. Gyorsabb, mint 40 üzenet a chatben.</p>
      </div>
      <Button onClick={() => setOpen(true)}>Új szavazás</Button>
      {!polls && <SkeletonList rows={2} avatar={false} />}
      {polls?.length === 0 && <EmptyState text="Még nem szavaztatok semmiről. Demokrácia, hol vagy?" />}
      {live.map((p) => (
        <Card key={p.id}>
          <p className="mb-2 text-sm text-muted">{p.creator?.display_name} kérdezi</p>
          <PollCard poll={p} />
        </Card>
      ))}
      {closed.length > 0 && <h2 className="text-lg font-bold">Lezárult</h2>}
      {closed.map((p) => (
        <Card key={p.id}>
          <PollCard poll={p} />
        </Card>
      ))}
      <NewPollSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

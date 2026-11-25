import { useState } from 'react'
import { useGroup } from '../../core/groups/GroupProvider'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { useBets } from './api'
import { BetCard } from './components/BetCard'
import { NewBetSheet } from './components/NewBetSheet'

export function BetsPage() {
  const { group } = useGroup()
  const { data: bets } = useBets(group.id)
  const [open, setOpen] = useState(false)
  const live = bets?.filter((b) => b.status !== 'resolved') ?? []
  const done = bets?.filter((b) => b.status === 'resolved') ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Fogadás</h1>
        <p className="mt-1 text-muted">Tippelés, lezárás, aztán a banda szavaz, ki nyert.</p>
      </div>
      <Button onClick={() => setOpen(true)}>Fogadjunk</Button>
      {bets?.length === 0 && <EmptyState text="Még senki nem fogadott semmibe. Gyanúsan óvatos banda." />}
      {live.map((b) => (
        <BetCard key={b.id} bet={b} />
      ))}
      {done.length > 0 && <h2 className="text-lg font-bold">Eldőlt</h2>}
      {done.map((b) => (
        <BetCard key={b.id} bet={b} />
      ))}
      <NewBetSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

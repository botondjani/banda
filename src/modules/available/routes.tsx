import { useState } from 'react'
import { useGroup } from '../../core/groups/GroupProvider'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { ListRow } from '../../ui/ListRow'
import { useActivePings } from './api'
import { PingAction } from './components/PingAction'
import { PingSheet } from './components/PingSheet'

export function AvailablePage() {
  const { group } = useGroup()
  const { data: pings } = useActivePings(group.id)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Ráérek most</h1>
      {pings?.length === 0 && <EmptyState text="Ma még senki nem ér rá. Légy te az első." />}
      {pings && pings.length > 0 && (
        <Card className="py-0">
          {pings.map((p) =>
            p.user ? (
              <ListRow
                key={p.id}
                leading={<Avatar name={p.user.display_name} color={p.user.color} src={p.user.avatar_url ?? undefined} />}
                title={`${p.user.display_name} · ${p.tag}`}
                meta={[p.note, p.ping_joins.length > 0 && `Benne: ${p.ping_joins.map((j) => j.user?.display_name).join(', ')}`].filter(Boolean).join(' · ') || undefined}
                value={<PingAction ping={p} />}
              />
            ) : null,
          )}
        </Card>
      )}
      <Button onClick={() => setOpen(true)}>Ráérek ma</Button>
      <PingSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

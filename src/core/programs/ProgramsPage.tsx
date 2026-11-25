import { useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDateTime } from '../../lib/format'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { ListRow } from '../../ui/ListRow'
import { useGroup } from '../groups/GroupProvider'
import { usePrograms } from './api'
import { NewProgramSheet } from './NewProgramSheet'

function DateBlock({ iso }: { iso: string | null }) {
  const d = iso ? new Date(iso) : null
  return (
    <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-line leading-none">
      <span className="font-display text-lg font-bold tabular-nums">{d ? d.getDate() : '?'}</span>
      <span className="text-[10px] font-semibold text-muted uppercase">{d ? d.toLocaleString('hu-HU', { month: 'short' }).replace('.', '') : 'mikor'}</span>
    </span>
  )
}

export function ProgramsPage() {
  const { group } = useGroup()
  const { data: programs } = usePrograms(group.id)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const now = Date.now()
  const upcoming = programs?.filter((p) => !p.starts_at || new Date(p.starts_at).getTime() >= now - 6 * 3600_000) ?? []
  const past = programs?.filter((p) => !upcoming.includes(p)).reverse() ?? []

  const row = (p: NonNullable<typeof programs>[number]) => (
    <ListRow
      key={p.id}
      leading={<DateBlock iso={p.starts_at} />}
      title={p.title}
      meta={[p.starts_at && formatDateTime(p.starts_at), p.location].filter(Boolean).join(' · ') || 'Időpont még nincs'}
      value={`${p.program_attendees.filter((a) => a.status === 'going').length} megy`}
      onClick={() => navigate(`/programs/${p.id}`)}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Programok</h1>
        {upcoming.length > 0 && <Button variant="secondary" onClick={() => setOpen(true)}>Új</Button>}
      </div>

      {programs && upcoming.length === 0 && (
        <EmptyState text="Senki nem szervez semmit. Megint." action={<Button onClick={() => setOpen(true)}>Szervezek valamit</Button>} />
      )}
      {upcoming.length > 0 && <Card className="py-0">{upcoming.map(row)}</Card>}

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Volt</h2>
          <Card className="py-0">{past.map(row)}</Card>
        </section>
      )}

      <NewProgramSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

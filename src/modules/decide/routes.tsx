import { useSearchParams } from 'react-router'
import { useGroup } from '../../core/groups/GroupProvider'
import { timeAgo } from '../../lib/format'
import { Card } from '../../ui/Card'
import { ListRow } from '../../ui/ListRow'
import { describeDraw, useDraws, type Kind } from './api'
import { DecideMode } from './components/DecideMode'
import { MODES } from './modes'

export function DecidePage() {
  const { group } = useGroup()
  const { data: draws = [] } = useDraws(group.id)
  const [params, setParams] = useSearchParams()
  const kind = params.get('mode') as Kind | null
  const setKind = (k: Kind | null) => setParams(k ? { mode: k } : {})

  if (kind) return <DecideMode key={kind} kind={kind} onBack={() => setKind(null)} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Döntéssegítő</h1>
        <p className="mt-1 text-muted">A szerver húz, nem lehet csalni. Elvileg.</p>
      </div>
      <Card className="py-0">
        {MODES.map((m) => (
          <ListRow key={m.kind} leading={<m.icon size={20} strokeWidth={1.75} />} title={m.label} meta={m.meta} onClick={() => setKind(m.kind)} />
        ))}
      </Card>
      {draws.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Legutóbb</h2>
          <Card className="py-0">
            {draws.slice(0, 10).map((d) => (
              <ListRow key={d.id} title={`${d.creator?.display_name} ${describeDraw(d.kind, d.result, d.options)}`} meta={timeAgo(d.created_at)} />
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

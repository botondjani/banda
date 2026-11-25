import { useNavigate } from 'react-router'
import { useGroup } from '../../core/groups/GroupProvider'
import { usePrograms } from '../../core/programs/api'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { ListRow } from '../../ui/ListRow'

// A lista programonként él; ez az oldal a közelgő programokhoz vezet.
export function BringPage() {
  const { group } = useGroup()
  const { data: programs } = usePrograms(group.id)
  const navigate = useNavigate()
  const upcoming = programs?.filter((p) => !p.starts_at || new Date(p.starts_at).getTime() > Date.now() - 6 * 3600_000) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Ki mit hoz</h1>
        <p className="mt-1 text-muted">Válassz programot, ott a lista.</p>
      </div>
      {programs && upcoming.length === 0 && <EmptyState text="Nincs közelgő program, így hozni sem kell semmit." />}
      {upcoming.length > 0 && (
        <Card className="py-0">
          {upcoming.map((p) => (
            <ListRow key={p.id} title={p.title} onClick={() => navigate(`/programs/${p.id}`)} />
          ))}
        </Card>
      )}
    </div>
  )
}

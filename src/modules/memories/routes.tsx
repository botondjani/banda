import { useSearchParams, useNavigate } from 'react-router'
import { useGoBack } from '../../lib/nav'
import { useGroup } from '../../core/groups/GroupProvider'
import { usePrograms } from '../../core/programs/api'
import { formatDateTime } from '../../lib/format'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { ListRow } from '../../ui/ListRow'
import { useAlbums } from './api'
import { Wrapped } from './components/Wrapped'
import { SkeletonList } from '../../ui/Skeleton'

// Decemberben az idei, januárban a tavalyi Wrapped érhető el (linkkel bármikor: ?wrapped=ÉV)
function wrappedYear(now = new Date()) {
  if (now.getMonth() === 11) return now.getFullYear()
  if (now.getMonth() === 0) return now.getFullYear() - 1
  return null
}

const sameDayLastYear = (iso: string | null) => {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() - 1 && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export function MemoriesPage() {
  const { group } = useGroup()
  const { data: albums } = useAlbums(group.id)
  const { data: programs = [] } = usePrograms(group.id)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const open = params.get('wrapped')
  const closeWrapped = useGoBack('/m/memories')
  const year = wrappedYear()
  const yearAgo = programs.filter((p) => sameDayLastYear(p.starts_at))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Emlékek</h1>
        <p className="mt-1 text-muted">Ami megtörtént, és van róla kép.</p>
      </div>

      {year && <Button onClick={() => setParams({ wrapped: String(year) })}>A banda éve: Wrapped {year}</Button>}

      {yearAgo.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Egy éve ma</h2>
          <Card className="py-0">
            {yearAgo.map((p) => (
              <ListRow key={p.id} title={p.title} meta={p.starts_at ? formatDateTime(p.starts_at) : undefined} onClick={() => navigate(`/programs/${p.id}`)} />
            ))}
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Albumok</h2>
        {!albums && <SkeletonList rows={2} avatar={false} />}
        {albums?.length === 0 && <EmptyState text="Még egy fotó sincs. Vagy nem történt semmi, vagy mindenki elfelejtett fotózni." />}
        {albums && albums.length > 0 && (
          <Card className="py-0">
            {albums.map((a) => (
              <ListRow
                key={a.id}
                title={a.title}
                meta={a.starts_at ? formatDateTime(a.starts_at) : undefined}
                value={<span className="text-sm text-muted tabular-nums">{a.photoCount} fotó</span>}
                onClick={() => navigate(`/programs/${a.id}`)}
              />
            ))}
          </Card>
        )}
      </section>

      {open && <Wrapped year={Number(open)} onClose={closeWrapped} />}
    </div>
  )
}

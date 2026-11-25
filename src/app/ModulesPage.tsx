import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useGroupModules } from '../core/groups/api'
import { useGroup } from '../core/groups/GroupProvider'
import { Card } from '../ui/Card'
import { ListRow } from '../ui/ListRow'
import { modules } from './modules'

export function ModulesPage() {
  const { group } = useGroup()
  const { data: state = {} } = useGroupModules(group.id)
  const navigate = useNavigate()
  const enabled = modules.filter((m) => state[m.id] ?? true)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Modulok</h1>
      {enabled.length === 0 ? (
        <p className="text-muted">Még nincs modul. Hamarosan beköltöznek.</p>
      ) : (
        <Card className="py-0">
          {enabled.map((m) => (
            <ListRow key={m.id} leading={<m.icon size={20} strokeWidth={1.75} />} title={m.name} onClick={() => navigate(`/m/${m.id}`)} />
          ))}
        </Card>
      )}
      <Card className="py-0">
        <ListRow title="Banda beállításai" meta="Meghívó, tagok, modulok ki-be" value={<ChevronRight size={20} strokeWidth={1.75} className="text-muted" />} onClick={() => navigate('/group')} />
      </Card>
    </div>
  )
}

import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useEnabledModules } from '../core/modules'
import { Card } from '../ui/Card'
import { ListRow } from '../ui/ListRow'

export function ModulesPage() {
  const modules = useEnabledModules()
  const navigate = useNavigate()
  const chevron = <ChevronRight size={20} strokeWidth={1.75} className="text-muted" />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Modulok</h1>
      {modules.length === 0 ? (
        <p className="text-muted">Minden modul ki van kapcsolva. Puritán banda.</p>
      ) : (
        <Card className="py-0">
          {modules.map((m) => (
            <ListRow
              key={m.id}
              leading={<m.icon size={20} strokeWidth={1.75} />}
              title={m.name}
              meta={m.description}
              value={chevron}
              onClick={() => navigate(`/m/${m.id}`)}
            />
          ))}
        </Card>
      )}
      <Card className="py-0">
        <ListRow title="Banda beállításai" meta="Meghívó, tagok, modulok ki-be" value={chevron} onClick={() => navigate('/group')} />
      </Card>
    </div>
  )
}

import { useParams } from 'react-router'
import { useEnabledModules } from '../core/modules'
import { EmptyState } from '../ui/EmptyState'

export function ModuleRoute() {
  const { moduleId } = useParams()
  const module = useEnabledModules().find((m) => m.id === moduleId)
  if (!module) return <EmptyState text="Ez a modul nincs bekapcsolva ebben a bandában." />
  return <module.Page />
}

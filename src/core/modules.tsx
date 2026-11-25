import type { LucideIcon } from 'lucide-react'
import { createContext, useContext, type ComponentType, type ReactNode } from 'react'
import type { FeedItem } from './feed/api'
import { useGroupModules } from './groups/api'
import { useGroup } from './groups/GroupProvider'

export type SheetProps = { open: boolean; onOpenChange: (open: boolean) => void }

export type ModuleManifest = {
  id: string
  name: string
  description: string
  icon: LucideIcon
  Page: ComponentType
  // activity.type -> a feed-elem szövege és extrái (a szereplő nevével együtt)
  feed?: Record<string, ComponentType<{ item: FeedItem }>>
  // a feed tetején, a címsor alatt
  FeedTop?: ComponentType
  // a program oldalán megjelenő szekció
  ProgramSection?: ComponentType<{ programId: string }>
  quickAction?: { label: string; meta: string; icon: LucideIcon; Sheet: ComponentType<SheetProps> }
  notificationTypes?: { type: string; label: string }[]
}

const ModulesContext = createContext<ModuleManifest[]>([])

export function ModulesProvider({ modules, children }: { modules: ModuleManifest[]; children: ReactNode }) {
  return <ModulesContext.Provider value={modules}>{children}</ModulesContext.Provider>
}

export function useAllModules() {
  return useContext(ModulesContext)
}

// Nincs group_modules sor = bekapcsolva
export function useEnabledModules() {
  const { group } = useGroup()
  const { data: state = {} } = useGroupModules(group.id)
  return useAllModules().filter((m) => state[m.id] ?? true)
}

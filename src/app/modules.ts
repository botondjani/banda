import type { LucideIcon } from 'lucide-react'

export type ModuleManifest = {
  id: string
  name: string
  icon: LucideIcon
}

// A modulok a saját fázisukban kerülnek ide.
export const modules: ModuleManifest[] = []

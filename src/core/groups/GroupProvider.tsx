import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { useMyGroups, type Group } from './api'
import { readActiveGroup, setActiveGroup } from './active'
import { NoGroupPage } from './NoGroupPage'
import { Splash } from '../../ui/Splash'

type Ctx = { group: Group; groups: Group[]; setGroupId: (id: string) => void }
const GroupContext = createContext<Ctx | null>(null)

export function GroupProvider({ children }: { children: ReactNode }) {
  const { data: groups } = useMyGroups()
  const [, rerender] = useReducer((n: number) => n + 1, 0)

  if (!groups) return <Splash />
  if (groups.length === 0) return <NoGroupPage />

  const group = groups.find((g) => g.id === readActiveGroup()) ?? groups[0]
  const setGroupId = (id: string) => {
    setActiveGroup(id)
    rerender()
  }

  return <GroupContext.Provider value={{ group, groups, setGroupId }}>{children}</GroupContext.Provider>
}

export function useGroup() {
  return useContext(GroupContext)!
}

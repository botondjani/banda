import { CalendarDays, CalendarPlus, LayoutGrid, Newspaper, Plus, User } from 'lucide-react'
import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { useSession } from '../core/auth/auth'
import { readPendingJoin } from '../core/groups/active'
import { GroupProvider } from '../core/groups/GroupProvider'
import { useEnabledModules } from '../core/modules'
import { NewProgramSheet } from '../core/programs/NewProgramSheet'
import { ListRow } from '../ui/ListRow'
import { Sheet } from '../ui/Sheet'

const tabs = [
  { to: '/', label: 'Feed', icon: Newspaper },
  { to: '/programs', label: 'Programok', icon: CalendarDays },
  { to: '/modules', label: 'Modulok', icon: LayoutGrid },
  { to: '/profile', label: 'Profil', icon: User },
]

export function Layout() {
  const session = useSession()
  if (session === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  const pendingJoin = readPendingJoin()
  if (pendingJoin) return <Navigate to={`/join/${pendingJoin}`} replace />

  return (
    <GroupProvider>
      <Shell />
    </GroupProvider>
  )
}

function Shell() {
  const [quickOpen, setQuickOpen] = useState(false)
  // melyik gyorsakció sheetje van nyitva: modul id vagy 'program'
  const [action, setAction] = useState<string | null>(null)
  const actions = useEnabledModules().filter((m) => m.quickAction)

  const open = (id: string) => {
    setQuickOpen(false)
    setAction(id)
  }
  const sheetProps = (id: string) => ({ open: action === id, onOpenChange: (o: boolean) => setAction(o ? id : null) })

  const tab = (t: (typeof tabs)[number]) => (
    <NavLink
      key={t.to}
      to={t.to}
      end={t.to === '/'}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-accent' : 'text-muted'}`
      }
    >
      <t.icon size={20} strokeWidth={1.75} />
      {t.label}
    </NavLink>
  )

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="px-5 pt-6 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md items-center">
          {tabs.slice(0, 2).map(tab)}
          <div className="flex flex-1 justify-center">
            <button
              onClick={() => setQuickOpen(true)}
              aria-label="Gyorsakciók"
              className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-transform duration-150 ease-out active:scale-95"
            >
              <Plus size={26} strokeWidth={2.25} />
            </button>
          </div>
          {tabs.slice(2).map(tab)}
        </div>
      </nav>

      <Sheet open={quickOpen} onOpenChange={setQuickOpen} title="Gyorsakciók">
        {actions.map(({ id, quickAction }) => {
          const { icon: Icon, label, meta } = quickAction!
          return <ListRow key={id} leading={<Icon size={20} strokeWidth={1.75} />} title={label} meta={meta} onClick={() => open(id)} />
        })}
        <ListRow leading={<CalendarPlus size={20} strokeWidth={1.75} />} title="Új program" meta="Időpont, hely, ki jön" onClick={() => open('program')} />
      </Sheet>
      {actions.map(({ id, quickAction }) => {
        const S = quickAction!.Sheet
        return <S key={id} {...sheetProps(id)} />
      })}
      <NewProgramSheet {...sheetProps('program')} />
    </div>
  )
}

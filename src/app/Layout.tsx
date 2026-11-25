import { CalendarDays, CalendarPlus, LayoutGrid, Newspaper, Plus, User } from 'lucide-react'
import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { useSession } from '../core/auth/auth'
import { readPendingJoin } from '../core/groups/active'
import { GroupProvider } from '../core/groups/GroupProvider'
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
  const [quickOpen, setQuickOpen] = useState(false)
  const [newProgram, setNewProgram] = useState(false)

  if (session === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  const pendingJoin = readPendingJoin()
  if (pendingJoin) return <Navigate to={`/join/${pendingJoin}`} replace />

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
    <GroupProvider>
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
          <ListRow
            leading={<CalendarPlus size={20} strokeWidth={1.75} />}
            title="Új program"
            meta="Időpont, hely, ki jön"
            onClick={() => {
              setQuickOpen(false)
              setNewProgram(true)
            }}
          />
        </Sheet>
        <NewProgramSheet open={newProgram} onOpenChange={setNewProgram} />
      </div>
    </GroupProvider>
  )
}

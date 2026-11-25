import { CalendarDays, CalendarPlus, LayoutGrid, Newspaper, Plus, User } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Navigate, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useSession } from '../core/auth/auth'
import { readPendingJoin } from '../core/groups/active'
import { GroupProvider } from '../core/groups/GroupProvider'
import { useEnabledModules } from '../core/modules'
import { NewProgramSheet } from '../core/programs/NewProgramSheet'
import { ListRow } from '../ui/ListRow'
import { Sheet } from '../ui/Sheet'
import { OfflineBanner } from './OfflineBanner'
import { Splash } from '../ui/Splash'

const tabs = [
  { to: '/', label: 'Feed', icon: Newspaper },
  { to: '/programs', label: 'Programok', icon: CalendarDays },
  { to: '/modules', label: 'Modulok', icon: LayoutGrid },
  { to: '/profile', label: 'Profil', icon: User },
]

export function Layout() {
  const session = useSession()
  if (session === undefined) return <Splash />
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
  const { pathname } = useLocation()

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
        `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'font-bold text-ink' : 'font-semibold text-muted'}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 ease-out ${isActive ? 'bg-accent text-on-accent' : ''}`}>
            <t.icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
          </span>
          {t.label}
        </>
      )}
    </NavLink>
  )

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <OfflineBanner />
      <ScrollRestoration />
      {/* finom beúszás oldalváltáskor; mozgáscsökkentésnél csak áttűnés (MotionConfig) */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="px-5 pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] pb-32"
      >
        <Outlet />
      </motion.main>

      <nav aria-label="Fő navigáció" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md items-center">
          {tabs.slice(0, 2).map(tab)}
          <div className="flex flex-1 justify-center">
            <button
              onClick={() => setQuickOpen(true)}
              aria-label="Gyorsakciók"
              className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-transform duration-150 ease-out active:scale-95"
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

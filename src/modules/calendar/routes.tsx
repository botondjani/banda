import { useState } from 'react'
import { useSession } from '../../core/auth/auth'
import { useMembers } from '../../core/groups/api'
import { useGroup } from '../../core/groups/GroupProvider'
import { NewProgramSheet } from '../../core/programs/NewProgramSheet'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { ListRow } from '../../ui/ListRow'
import { calendarDays, isoDay, useFreeDays, useSetDay, type DayState } from './api'

const NEXT: Record<string, DayState | null> = { none: 'free', free: 'maybe', maybe: 'busy', busy: null }
const DOT: Record<DayState, string> = { free: 'bg-positive', maybe: 'border-2 border-positive', busy: 'bg-negative' }
const WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']
const dayLabel = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' })

export function CalendarPage() {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const days = calendarDays()
  const today = isoDay(new Date())
  const from = isoDay(days[0])
  const { data: rows = [] } = useFreeDays(group.id, from, isoDay(days[days.length - 1]))
  const { data: members = [] } = useMembers(group.id)
  const setDay = useSetDay(group.id, uid)
  const [programDay, setProgramDay] = useState<string | null>(null)

  const stats = new Map<string, { free: string[]; maybe: string[]; mine?: DayState }>()
  for (const r of rows) {
    const s = stats.get(r.day) ?? { free: [], maybe: [] }
    if (r.state === 'free') s.free.push(r.user?.display_name ?? '?')
    if (r.state === 'maybe') s.maybe.push(r.user?.display_name ?? '?')
    if (r.user_id === uid) s.mine = r.state as DayState
    stats.set(r.day, s)
  }
  const score = (day: string) => {
    const s = stats.get(day)
    return s ? s.free.length + s.maybe.length / 2 : 0
  }
  const best = [...stats.keys()]
    .filter((d) => d >= today && score(d) > 0)
    .sort((a, b) => score(b) - score(a) || a.localeCompare(b))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Ki ér rá?</h1>
        <p className="mt-1 text-muted">Bökj a napokra: szabad → talán → foglalt.</p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 text-center text-xs font-semibold text-muted">
            {w}
          </span>
        ))}
        {days.map((d) => {
          const day = isoDay(d)
          const past = day < today
          const mine = stats.get(day)?.mine
          const pct = members.length ? Math.round((score(day) / members.length) * 70) : 0
          return (
            <button
              key={day}
              disabled={past}
              aria-label={`${dayLabel.format(d)}${mine ? `, te: ${mine}` : ''}`}
              onClick={() => setDay.mutate({ day, state: NEXT[mine ?? 'none'] })}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold tabular-nums disabled:opacity-35 ${best[0] === day ? 'border-ink border-2' : 'border-line'} ${day === today ? 'underline underline-offset-4' : ''}`}
              style={{ background: `color-mix(in srgb, var(--positive) ${pct}%, var(--surface))` }}
            >
              {d.getDate()}
              <span className={`mt-0.5 size-1.5 rounded-full ${mine ? DOT[mine] : ''}`} />
            </button>
          )
        })}
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${DOT.free}`} /> szabad</span>
        <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${DOT.maybe}`} /> talán</span>
        <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${DOT.busy}`} /> foglalt</span>
        <span>Zöldebb = többen érnek rá</span>
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Legjobb napok</h2>
        {best.length === 0 ? (
          <p className="text-muted">Még senki nem jelölt semmit. Kezdd te.</p>
        ) : (
          <Card className="py-0">
            {best.map((day) => {
              const s = stats.get(day)!
              return (
                <ListRow
                  key={day}
                  title={dayLabel.format(new Date(`${day}T12:00`))}
                  meta={[s.free.length && `Szabad: ${s.free.join(', ')}`, s.maybe.length && `Talán: ${s.maybe.join(', ')}`].filter(Boolean).join(' · ')}
                  value={<Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => setProgramDay(day)}>Program</Button>}
                />
              )
            })}
          </Card>
        )}
      </section>

      <NewProgramSheet
        key={programDay}
        open={programDay !== null}
        onOpenChange={(o) => !o && setProgramDay(null)}
        defaultStartsAt={programDay ? `${programDay}T19:00` : ''}
      />
    </div>
  )
}

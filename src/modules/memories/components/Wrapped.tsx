import { X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useGroup } from '../../../core/groups/GroupProvider'
import { formatFt } from '../../../lib/format'
import { USER_COLORS } from '../../../ui/Avatar'
import { useWrapped, type WrappedData } from '../api'

type Slide = { big: ReactNode; text: string; sub?: string }

const SLIDE_MS = 5000

function slides(w: WrappedData, group: string): Slide[] {
  const s: Slide[] = [{ big: String(w.year), text: `${group}: ez volt az évünk.`, sub: 'Bökj a jobb oldalra a továbblépéshez.' }]
  if (w.programs) s.push({ big: String(w.programs), text: 'program', sub: w.top_attendee ? `Legtöbbször ${w.top_attendee.name} volt ott (${w.top_attendee.count}×).` : undefined })
  if (w.spent) s.push({ big: formatFt(w.spent), text: 'ment el közösen', sub: w.biggest_expense ? `A legnagyobb tétel: ${w.biggest_expense.title}, ${formatFt(w.biggest_expense.amount)}.` : undefined })
  if (w.photos) s.push({ big: String(w.photos), text: 'fotó', sub: w.top_photographer ? `A banda fotósa: ${w.top_photographer.name} (${w.top_photographer.count} kép).` : undefined })
  if (w.pings) s.push({ big: String(w.pings), text: 'alkalommal ért rá valaki', sub: w.top_tag ? `Legtöbbször: ${w.top_tag}. Nem meglepő.` : undefined })
  if (w.top_payer) s.push({ big: `${w.top_payer.count}×`, text: `${w.top_payer.name} fizette a kört`, sub: 'A szerver sorsolta, nem mi. Esküszünk.' })
  if (w.challenges_completed || w.bets) s.push({ big: String(w.challenges_completed), text: 'teljesített kihívás', sub: w.bets ? `És ${w.bets} eldőlt fogadás.` : undefined })
  if (w.top_item) s.push({ big: w.top_item.rating.toLocaleString('hu-HU'), text: `csillag: ${w.top_item.title}`, sub: 'Az év legjobbra értékelt ajánlása.' })
  if (w.top_xp) s.push({ big: `${w.top_xp.xp} XP`, text: `Az év bandatagja: ${w.top_xp.name}`, sub: 'Jövőre te jössz. Talán.' })
  return s
}

// Csak a záró képen, mozgáscsökkentésnél kikapcsol
function Confetti() {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block size-2.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: i % 3 === 0 ? 'var(--accent)' : USER_COLORS[i % USER_COLORS.length] }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: 900, rotate: 360 + i * 20, opacity: 0.9 }}
          transition={{ type: 'spring', stiffness: 18, damping: 6, delay: (i % 9) * 0.08 }}
        />
      ))}
    </div>
  )
}

export function Wrapped({ year, onClose }: { year: number; onClose: () => void }) {
  const { group } = useGroup()
  const { data } = useWrapped(group.id, year)
  const [i, setI] = useState(0)
  const list = data ? slides(data, group.name) : []
  const last = i === list.length - 1

  useEffect(() => {
    if (!list.length || last) return
    const t = setTimeout(() => setI((n) => n + 1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [i, list.length, last])

  const slide = list[i]
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#191714] text-[#F2EEE7]" role="dialog" aria-label={`Wrapped ${year}`}>
      <div className="flex gap-1 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {list.map((_, n) => (
          <span key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.span
              className="block h-full bg-[#FF6B42]"
              initial={{ width: n < i ? '100%' : '0%' }}
              animate={{ width: n < i ? '100%' : n === i ? '100%' : '0%' }}
              transition={{ duration: n === i && !last ? SLIDE_MS / 1000 : 0, ease: 'linear' }}
            />
          </span>
        ))}
      </div>
      <button aria-label="Bezárás" onClick={onClose} className="absolute top-[max(1.75rem,calc(env(safe-area-inset-top)+0.75rem))] right-3 z-10 flex size-11 items-center justify-center">
        <X size={24} strokeWidth={1.75} />
      </button>
      {slide ? (
        <div className="relative flex flex-1">
          <button aria-label="Előző" className="w-1/3" onClick={() => setI(Math.max(0, i - 1))} />
          <button aria-label="Következő" className="w-2/3" onClick={() => (last ? onClose() : setI(i + 1))} />
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
          >
            <p className="font-display text-7xl font-extrabold tabular-nums">{slide.big}</p>
            <p className="font-display text-2xl font-bold">{slide.text}</p>
            {slide.sub && <p className="max-w-xs text-[#9A9287]">{slide.sub}</p>}
          </motion.div>
          {last && <Confetti />}
        </div>
      ) : (
        <p className="m-auto text-[#9A9287]">Számolunk…</p>
      )}
    </div>
  )
}

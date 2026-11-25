import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { DrawOptions, DrawResult, Kind } from '../api'

// Rövid "pörgés" (csak vizuális), majd a szerver eredménye
function useRolling(final: string, pool: string[], ms = 900) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? final : pool[0] ?? final)
  const [done, setDone] = useState(reduced)
  useEffect(() => {
    if (reduced) return
    let i = 0
    const tick = setInterval(() => setShown(pool[i++ % pool.length]), 70)
    const stop = setTimeout(() => {
      clearInterval(tick)
      setShown(final)
      setDone(true)
    }, ms)
    return () => {
      clearInterval(tick)
      clearTimeout(stop)
    }
  }, [final, pool, ms, reduced])
  return { shown, done }
}

const big = 'font-display text-6xl font-extrabold tabular-nums'

function Rolling({ final, pool, ms }: { final: string; pool: string[]; ms?: number }) {
  const { shown, done } = useRolling(final, pool, ms)
  return (
    <motion.p className={big} animate={done ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.25, ease: 'easeOut' }}>
      {shown}
    </motion.p>
  )
}

function Coin({ side }: { side: string }) {
  const reduced = useReducedMotion()
  const turns = 1800 + (side === 'írás' ? 180 : 0)
  const face = 'absolute inset-0 flex items-center justify-center rounded-full font-display text-2xl font-extrabold [backface-visibility:hidden]'
  return (
    <div className="mx-auto size-40 [perspective:600px]">
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: turns }}
        transition={{ duration: reduced ? 0 : 1.6, ease: [0.2, 0.7, 0.3, 1] }}
      >
        <div className={`${face} bg-accent text-white`}>FEJ</div>
        <div className={`${face} bg-ink text-paper [transform:rotateY(180deg)]`}>ÍRÁS</div>
      </motion.div>
    </div>
  )
}

function Stagger({ rows }: { rows: string[] }) {
  return (
    <ol className="flex flex-col gap-2 text-left">
      {rows.map((r, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15, duration: 0.2, ease: 'easeOut' }}
          className="rounded-card border border-line bg-surface px-4 py-3 font-semibold"
        >
          {r}
        </motion.li>
      ))}
    </ol>
  )
}

export function Reveal({ kind, result, options, names }: { kind: Kind; result: DrawResult; options: DrawOptions; names: string[] }) {
  switch (kind) {
    case 'coin':
      return <Coin side={result.side ?? 'fej'} />
    case 'dice':
      return (
        <div className="flex justify-center gap-4">
          {(result.rolls ?? []).map((n, i) => (
            <Rolling key={i} final={String(n)} pool={['1', '2', '3', '4', '5', '6']} ms={900 + i * 250} />
          ))}
        </div>
      )
    case 'number': {
      const lo = options.min ?? 0
      const hi = options.max ?? 100
      const pool = Array.from({ length: 12 }, (_, i) => String(Math.round(lo + ((hi - lo) * i) / 11)))
      return <Rolling final={String(result.value)} pool={pool} />
    }
    case 'pay':
      return <Rolling final={result.name ?? '?'} pool={names.length ? names : ['?']} ms={1800} />
    case 'shuffle':
      return <Stagger rows={(result.order ?? []).map((x, i) => `${i + 1}. ${x}`)} />
    case 'teams':
      return <Stagger rows={(result.teams ?? []).map((t, i) => `${i + 1}. csapat: ${t.join(', ')}`)} />
    default:
      return null
  }
}

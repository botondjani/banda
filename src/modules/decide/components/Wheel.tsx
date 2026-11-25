import { motion, useReducedMotion } from 'motion/react'
import { USER_COLORS } from '../../../ui/Avatar'

type Props = { items: string[]; target: number | null; onDone: () => void }

const R = 140
const point = (deg: number, r = R) => {
  const a = ((deg - 90) * Math.PI) / 180
  return `${R + r * Math.cos(a)} ${R + r * Math.sin(a)}`
}

// Felül a mutató; a cél-szelet közepe oda forog be
export function Wheel({ items, target, onDone }: Props) {
  const reduced = useReducedMotion()
  const seg = 360 / Math.max(items.length, 1)
  const rotate = target === null ? 0 : 360 * 6 - (target + 0.5) * seg

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute top-[-6px] left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent border-t-ink" />
      <motion.svg
        viewBox={`0 0 ${R * 2} ${R * 2}`}
        className="w-full"
        animate={{ rotate }}
        transition={target === null ? { duration: 0 } : { duration: reduced ? 0 : 4.2, ease: [0.12, 0.8, 0.2, 1] }}
        onAnimationComplete={() => target !== null && onDone()}
      >
        {items.map((item, i) => {
          const mid = (i + 0.5) * seg
          return (
            <g key={i}>
              {items.length > 1 && (
                <path
                  d={`M ${R} ${R} L ${point(i * seg)} A ${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${point((i + 1) * seg)} Z`}
                  fill={USER_COLORS[i % USER_COLORS.length]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              )}
              <text
                transform={`rotate(${mid} ${R} ${R})`}
                x={R}
                y={R - R * 0.62}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[#191714] font-sans text-[13px] font-bold"
              >
                {item.length > 12 ? `${item.slice(0, 11)}…` : item}
              </text>
            </g>
          )
        })}
        <circle cx={R} cy={R} r={14} fill="var(--ink)" />
      </motion.svg>
    </div>
  )
}

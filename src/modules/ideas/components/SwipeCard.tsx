import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import type { Idea, Vote } from '../api'

// Jobbra = benne, balra = passz
export function SwipeCard({ idea, inCount, threshold, onVote }: { idea: Idea; inCount: number; threshold: number; onVote: (v: Vote) => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  const inOpacity = useTransform(x, [20, 100], [0, 1])
  const passOpacity = useTransform(x, [-100, -20], [1, 0])

  function end(_: unknown, info: PanInfo) {
    if (info.offset.x > 100) onVote('in')
    else if (info.offset.x < -100) onVote('pass')
  }

  return (
    <motion.div
      drag="x"
      dragSnapToOrigin
      onDragEnd={end}
      style={{ x, rotate }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: x.get() >= 0 ? 320 : -320, transition: { duration: 0.2, ease: 'easeOut' } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex min-h-56 cursor-grab touch-pan-y flex-col justify-between rounded-[20px] border border-line bg-surface p-6 shadow-[0_8px_24px_rgba(0,0,0,0.10)] active:cursor-grabbing"
    >
      <motion.span style={{ opacity: inOpacity }} className="absolute top-5 right-5 rounded-full border-2 border-positive px-3 py-1 text-sm font-bold text-positive">
        BENNE
      </motion.span>
      <motion.span style={{ opacity: passOpacity }} className="absolute top-5 left-5 rounded-full border-2 border-negative px-3 py-1 text-sm font-bold text-negative">
        PASSZ
      </motion.span>
      <span className="text-sm text-muted">{idea.creator?.display_name} ötlete</span>
      <span className="font-display text-3xl font-bold">{idea.title}</span>
      <span className="font-display font-semibold text-muted tabular-nums">
        {inCount}/{threshold} benne
      </span>
    </motion.div>
  )
}

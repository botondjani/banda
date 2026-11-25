import type { ButtonHTMLAttributes } from 'react'
import { haptic } from '../lib/haptics'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }

// Választható címke (pl. ráérés: sör, kaja…)
export function Chip({ selected, className = '', onClick, ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={(e) => {
        haptic()
        onClick?.(e)
      }}
      className={`min-h-11 rounded-full border px-4 font-semibold transition-colors duration-150 ease-out ${selected ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink'} ${className}`}
      {...props}
    />
  )
}

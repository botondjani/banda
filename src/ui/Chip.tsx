import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }

// Választható címke (pl. ráérés: sör, kaja…)
export function Chip({ selected, className = '', ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-11 rounded-full border px-4 font-semibold transition-colors duration-150 ease-out ${selected ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink'} ${className}`}
      {...props}
    />
  )
}

import { haptic } from '../lib/haptics'

type Props<T extends string> = {
  options: { value: T; label: string }[]
  value: T | undefined
  onChange: (value: T) => void
}

// Egy választás több közül, azonnali hatással (pl. részvétel). Tartalomváltáshoz: Tabs.
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div role="radiogroup" className="flex gap-1 rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => {
            if (o.value !== value) haptic()
            onChange(o.value)
          }}
          className="min-h-10 flex-1 rounded-full text-sm font-semibold text-muted transition-colors duration-150 aria-checked:bg-ink aria-checked:text-paper"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

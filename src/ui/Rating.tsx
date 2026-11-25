import { Star } from 'lucide-react'
import { haptic } from '../lib/haptics'

type Props = { value: number | null; onChange?: (value: number | null) => void; size?: number }

// 1–5 csillag; ugyanarra bökve törlődik. onChange nélkül csak megjelenít.
export function Rating({ value, onChange, size = 28 }: Props) {
  return (
    <div className="flex gap-1" role={onChange ? 'radiogroup' : undefined} aria-label="Értékelés">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value !== null && n <= value
        const star = <Star size={size} strokeWidth={1.75} className={on ? 'fill-accent-text text-accent-text' : 'text-line'} />
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} csillag`} onClick={() => {
            haptic()
            onChange(value === n ? null : n)
          }}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}

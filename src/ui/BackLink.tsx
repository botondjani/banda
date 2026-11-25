import { ChevronLeft } from 'lucide-react'

// Fejléc feletti "‹ Vissza" gomb, legalább 44 px érintési felülettel
export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-2 inline-flex min-h-11 items-center gap-1 pr-3 pl-1 text-sm font-semibold text-muted">
      <ChevronLeft size={20} strokeWidth={1.75} aria-hidden /> {label}
    </button>
  )
}

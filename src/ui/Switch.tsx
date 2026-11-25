type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string }

export function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ease-out ${checked ? 'bg-accent' : 'bg-line'}`}
    >
      <span className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform duration-150 ease-out ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

import { useId, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Input({ label, className = '', ...props }: Props) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <input
        id={id}
        className={`min-h-11 rounded-xl border border-line bg-surface px-4 text-ink outline-none placeholder:text-muted focus:border-ink ${className}`}
        {...props}
      />
    </label>
  )
}

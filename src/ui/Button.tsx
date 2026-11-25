import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

const variants = {
  primary: 'bg-accent text-white',
  secondary: 'border border-line bg-surface text-ink',
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

import type { ReactNode } from 'react'

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="max-w-64 text-muted">{text}</p>
      {action}
    </div>
  )
}

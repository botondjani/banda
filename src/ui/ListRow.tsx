import type { ReactNode } from 'react'

type Props = {
  leading?: ReactNode
  title: ReactNode
  meta?: ReactNode
  value?: ReactNode
  onClick?: () => void
}

export function ListRow({ leading, title, meta, value, onClick }: Props) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0"
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{title}</span>
        {meta && <span className="truncate text-sm text-muted">{meta}</span>}
      </span>
      {value && <span className="shrink-0 font-display text-lg font-semibold tabular-nums">{value}</span>}
    </Tag>
  )
}

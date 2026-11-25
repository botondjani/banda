import { useNavigate } from 'react-router'
import type { SheetProps } from '../../../core/modules'
import { ListRow } from '../../../ui/ListRow'
import { Sheet } from '../../../ui/Sheet'
import { MODES } from '../modes'

export function DecideSheet({ open, onOpenChange }: SheetProps) {
  const navigate = useNavigate()
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Sorsolás">
      {MODES.map((m) => (
        <ListRow
          key={m.kind}
          leading={<m.icon size={20} strokeWidth={1.75} />}
          title={m.label}
          meta={m.meta}
          onClick={() => {
            onOpenChange(false)
            navigate(`/m/decide?mode=${m.kind}`)
          }}
        />
      ))}
    </Sheet>
  )
}

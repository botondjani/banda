import { useState, type FormEvent } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useMembers } from '../../../core/groups/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import type { SheetProps } from '../../../core/modules'
import { formatFt } from '../../../lib/format'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Segmented } from '../../../ui/Segmented'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useAddExpense, type SplitMode } from '../api'

const MODES: { value: SplitMode; label: string }[] = [
  { value: 'equal', label: 'Egyenlő' },
  { value: 'exact', label: 'Pontos' },
  { value: 'shares', label: 'Arányos' },
]

const digits = (v: string) => Number(v.replace(/\D/g, '')) || 0

export function ExpenseSheet({ open, onOpenChange, programId }: SheetProps & { programId?: string }) {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: members = [] } = useMembers(group.id)
  const add = useAddExpense(group.id)
  const people = members.flatMap((m) => (m.user ? [m.user] : []))

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(uid)
  const [mode, setMode] = useState<SplitMode>('equal')
  const [excluded, setExcluded] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})

  const total = digits(amount)
  const included = people.filter((p) => !excluded.includes(p.id))
  const exactSum = included.reduce((s, p) => s + digits(values[p.id] ?? ''), 0)
  const exactDiff = total - exactSum
  const valid = title.trim() && total > 0 && included.length > 0 && (mode !== 'exact' || exactDiff === 0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const parts = Object.fromEntries(
      included.map((p) => [p.id, mode === 'equal' ? 1 : mode === 'shares' ? digits(values[p.id] ?? '1') || 1 : digits(values[p.id] ?? '')]),
    )
    try {
      await add.mutateAsync({ title: title.trim(), amount: total, paidBy, mode, parts, programId })
      setTitle('')
      setAmount('')
      setValues({})
      onOpenChange(false)
    } catch {
      toast.error('Nem sikerült menteni.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Új kiadás">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Input label="Mire?" placeholder="Pl. pizza, benzin, szállás" maxLength={60} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Összeg (Ft)" inputMode="numeric" placeholder="0" required value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">Ki fizette?</span>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <Chip key={p.id} selected={paidBy === p.id} onClick={() => setPaidBy(p.id)}>
                {p.id === uid ? 'Én' : p.display_name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-muted">Kire osztjuk?</span>
          <Segmented options={MODES} value={mode} onChange={setMode} />
          {people.map((p) => {
            const on = !excluded.includes(p.id)
            return (
              <div key={p.id} className="flex items-center gap-3">
                <Chip selected={on} className="flex-1 text-left" onClick={() => setExcluded(on ? [...excluded, p.id] : excluded.filter((x) => x !== p.id))}>
                  {p.display_name}
                </Chip>
                {on && mode !== 'equal' && (
                  <input
                    aria-label={`${p.display_name} ${mode === 'exact' ? 'összege' : 'aránya'}`}
                    inputMode="numeric"
                    placeholder={mode === 'exact' ? 'Ft' : '1'}
                    value={values[p.id] ?? ''}
                    onChange={(e) => setValues({ ...values, [p.id]: e.target.value.replace(/\D/g, '') })}
                    className="min-h-11 w-24 rounded-xl border border-line bg-surface px-3 text-right tabular-nums outline-none focus:border-ink"
                  />
                )}
              </div>
            )
          })}
          {mode === 'exact' && total > 0 && exactDiff !== 0 && (
            <p className="text-sm text-negative">{exactDiff > 0 ? `Még ${formatFt(exactDiff)} nincs kiosztva.` : `${formatFt(-exactDiff)}-tal több a kelleténél.`}</p>
          )}
          {mode === 'shares' && <p className="text-sm text-muted">Pl. 2 : 1 = az egyik kétszer annyit fizet.</p>}
        </div>

        <Button type="submit" disabled={!valid || add.isPending}>Mentés</Button>
      </form>
    </Sheet>
  )
}

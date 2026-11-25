import { useState, type FormEvent } from 'react'
import { useSession } from '../../../core/auth/auth'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Segmented } from '../../../ui/Segmented'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useAddItem, type Kind } from '../api'
import { KIND_LABELS } from './labels'

type Props = SheetProps & { programId: string; groupId: string; kind: Kind }

export function AddItemSheet({ open, onOpenChange, programId, groupId, kind: initialKind }: Props) {
  const uid = useSession()?.user.id ?? null
  const add = useAddItem(programId, groupId)
  const [kind, setKind] = useState<Kind>(initialKind)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [mine, setMine] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await add.mutateAsync({ kind, name: name.trim(), qty: qty.trim() || null, claimed_by: mine ? uid : null })
      setName('')
      setQty('')
      onOpenChange(false)
    } catch {
      toast.error('Nem sikerült felvenni.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Mi kell még?">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Segmented options={(['consumable', 'gear'] as const).map((k) => ({ value: k, label: KIND_LABELS[k] }))} value={kind} onChange={setKind} />
        <Input label="Mi?" placeholder={kind === 'gear' ? 'Pl. sátor, bogrács' : 'Pl. szén, sör, kenyér'} maxLength={60} required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Mennyi?" placeholder="Pl. 2 kg, 6 db – nem kötelező" maxLength={20} value={qty} onChange={(e) => setQty(e.target.value)} />
        <div>
          <Chip selected={mine} onClick={() => setMine(!mine)}>Én hozom</Chip>
        </div>
        <Button type="submit" disabled={add.isPending || !name.trim()}>Hozzáadás</Button>
      </form>
    </Sheet>
  )
}

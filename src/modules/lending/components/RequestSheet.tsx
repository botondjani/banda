import { useState, type FormEvent } from 'react'
import { useGroup } from '../../../core/groups/GroupProvider'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Input } from '../../../ui/Input'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useRequestLoan, type LendItem } from '../api'

const isoIn = (days: number) => {
  const d = new Date(Date.now() + days * 86400_000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function RequestSheet({ open, onOpenChange, item }: SheetProps & { item: LendItem }) {
  const { group } = useGroup()
  const request = useRequestLoan(group.id)
  const [due, setDue] = useState(isoIn(7))

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await request.mutateAsync({ item, due })
      onOpenChange(false)
      toast.success('Elkérted. Szóltunk a gazdájának.')
    } catch {
      toast.error('Nem sikerült. Lehet, hogy közben más elkérte.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Elkérem: ${item.name}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Meddig kell?" type="date" min={isoIn(0)} required value={due} onChange={(e) => setDue(e.target.value)} />
        <Button type="submit" disabled={request.isPending}>Elkérem</Button>
      </form>
    </Sheet>
  )
}

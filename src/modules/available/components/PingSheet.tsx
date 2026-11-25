import { useState, type FormEvent } from 'react'
import { useGroup } from '../../../core/groups/GroupProvider'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { TAGS, useCreatePing } from '../api'

export function PingSheet({ open, onOpenChange }: SheetProps) {
  const { group } = useGroup()
  const create = useCreatePing(group.id)
  const [tag, setTag] = useState<string>(TAGS[0])
  const [note, setNote] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ tag, note: note.trim() || null })
      setNote('')
      onOpenChange(false)
      toast.success('Szóltunk a többieknek.')
    } catch {
      toast.error('Nem ment el.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Ráérek ma">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <Chip key={t} selected={t === tag} onClick={() => setTag(t)}>
              {t}
            </Chip>
          ))}
        </div>
        <Input label="Megjegyzés" placeholder="Pl. 8 után, a szokásos helyen" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" disabled={create.isPending}>Szólok a többieknek</Button>
      </form>
    </Sheet>
  )
}

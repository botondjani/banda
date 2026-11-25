import { useState, type FormEvent } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Input } from '../../../ui/Input'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useAddIdea } from '../api'

export function NewIdeaSheet({ open, onOpenChange }: SheetProps) {
  const { group } = useGroup()
  const add = useAddIdea(group.id, useSession()!.user.id)
  const [title, setTitle] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await add.mutateAsync(title.trim())
      setTitle('')
      onOpenChange(false)
      toast.success('Bedobva. Most szavazzanak a többiek.')
    } catch {
      toast.error('Nem ment el.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Új ötlet">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Mi lenne jó?" placeholder="Pl. bowling, Balaton-hétvége, kvíz est" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit" disabled={add.isPending || !title.trim()}>Bedobom</Button>
      </form>
    </Sheet>
  )
}

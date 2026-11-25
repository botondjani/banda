import { useState, type FormEvent } from 'react'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Input } from '../../../ui/Input'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useAddListItem, type List } from '../api'
import { presetOf } from '../presets'

export function AddListItemSheet({ open, onOpenChange, list }: SheetProps & { list: List }) {
  const add = useAddListItem(list)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await add.mutateAsync({ title: title.trim(), url: url.trim() || null, note: note.trim() || null })
      setTitle('')
      setUrl('')
      setNote('')
      onOpenChange(false)
    } catch {
      toast.error('Nem sikerült menteni. A link http(s)://-sel kezdődjön.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Ajánlás: ${list.title}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Mit ajánlasz?" placeholder={presetOf(list.preset_key).placeholder} maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Miért?" placeholder="Nem kötelező, de segít" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
        <Input label="Link" type="url" placeholder="https://… – nem kötelező" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit" disabled={add.isPending || !title.trim()}>Hozzáadás</Button>
      </form>
    </Sheet>
  )
}
